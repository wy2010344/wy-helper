import { KVPair } from '../KVPair';
import { joinPath } from '../path';
import { emptyObject, quote } from '../util';
import { matchMatch, MatchNode, toMatchNode } from './match';

type RouteBranch<BranchLoader, LeafLoader, NotfoundLoader> = {
  //名称
  key: string;
  match: MatchNode;
  order: number;
  //布局页面
  layout?(): Promise<BranchLoader>;
  //无子路径页面
  index?(): Promise<LeafLoader>;
  //如果所有匹配失败,则转向它
  default?(): Promise<NotfoundLoader>;
  children?: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>[];
};
function sortBranch(
  a: RouteBranch<any, any, any>,
  b: RouteBranch<any, any, any>
) {
  return a.order - b.order;
}

export class TreeRoute<BranchLoader, LeafLoader, NotfoundLoader> {
  constructor(
    private typeDefMap: Record<string, (v: string) => any>,
    private transLoader: {
      (x: () => Promise<LeafLoader>): () => Promise<LeafLoader>;
      (x: () => Promise<NotfoundLoader>): () => Promise<NotfoundLoader>;
      (x: () => Promise<BranchLoader>): () => Promise<BranchLoader>;
    } = quote
  ) {}
  private rootBranch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader> = {
    key: '',
    match: '',
    order: 0,
  };

  buildFromMap(
    pages: Record<string, () => Promise<any>>,
    prefix: string,
    INDEX = 'index',
    LAYOUT = 'layout',
    DEFAULT = 'default'
  ) {
    for (const key in pages) {
      const queryPath = key.slice(prefix.length, key.lastIndexOf('.'));
      if (queryPath.endsWith(INDEX)) {
        const nodes = queryPath
          .slice(0, queryPath.length - INDEX.length)
          .split('/')
          .filter(quote);
        const tempBranch = this.buildRoot(nodes);
        tempBranch.index = this.transLoader(pages[key]) as any;
      }
      if (queryPath.endsWith(LAYOUT)) {
        const nodes = queryPath
          .slice(0, queryPath.length - LAYOUT.length)
          .split('/')
          .filter(quote);
        const tempBranch = this.buildRoot(nodes);
        tempBranch.layout = this.transLoader(pages[key]) as any;
      }

      if (queryPath.endsWith(DEFAULT)) {
        const nodes = queryPath
          .slice(0, queryPath.length - DEFAULT.length)
          .split('/')
          .filter(quote);
        const tempBranch = this.buildRoot(nodes);
        tempBranch.default = this.transLoader(pages[key]) as any;
      }
    }
  }
  buildRoot(nodes: string[]) {
    let tempBranch = this.rootBranch;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!tempBranch.children) {
        tempBranch.children = [];
      }
      let subBranch = tempBranch.children.find(x => x.key == node);
      if (!subBranch) {
        const sp = node.split('.');
        let order = 0;
        let match = node;
        if (sp.length > 1) {
          order = Number(sp[0]);
          if (isNaN(order)) {
            order = 0;
          } else {
            sp.shift();
            match = sp.join('.');
          }
        }
        subBranch = {
          key: node,
          match: toMatchNode(match, this.typeDefMap),
          order,
        };
        tempBranch.children.push(subBranch);
      }
      tempBranch = subBranch;
    }
    return tempBranch;
  }

  private sort(vs: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>[]) {
    vs.sort(sortBranch);
    for (let i = 0; i < vs.length; i++) {
      const children = vs[i].children;
      if (children) {
        this.sort(children);
      }
    }
  }
  finishBuild() {
    const rootChildren = this.rootBranch.children;
    if (rootChildren) {
      this.sort(rootChildren);
    }
    return rootChildren;
  }
  matchNodes(nodes: string[]) {
    const ret = buildBranch(nodes, 0, this.rootBranch, undefined);
    return ret;
  }
}

function buildBranch<BranchLoader, LeafLoader, NotfoundLoader>(
  nodes: string[],
  index: number,
  branch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>,
  currentQuery?: KVPair<any>
): PairNode<BranchLoader, LeafLoader, NotfoundLoader> {
  const ret = foundInner(nodes, index, branch, currentQuery);
  if (branch.layout) {
    return new PairBranchI(branch, nodes, index, ret, currentQuery);
  }
  return ret;
}
function foundInner<BranchLoader, LeafLoader, NotfoundLoader>(
  nodes: string[],
  index: number,
  tempBranch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>,
  currentQuery: KVPair<any> | undefined
): PairNode<BranchLoader, LeafLoader, NotfoundLoader> {
  try {
    if (index == nodes.length) {
      //叶子节点
      if (tempBranch.index) {
        return new PairLeafI(nodes, index, tempBranch.index!, currentQuery);
      } else {
        throw new Error('not found');
      }
    } else if (tempBranch.children) {
      //枝节点
      const node = nodes[index];
      let foundMath:
        | RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>
        | undefined = undefined;
      for (let i = 0; i < tempBranch.children.length && !foundMath; i++) {
        const cacheTempBranch = tempBranch.children[i];
        const match = cacheTempBranch.match;
        try {
          currentQuery = matchMatch(node, match, currentQuery);
          foundMath = cacheTempBranch;
        } catch (err) {}
      }
      if (foundMath) {
        return buildBranch(nodes, index + 1, foundMath, currentQuery);
      } else {
        throw new Error('not found');
      }
    } else {
      throw new Error('not found');
    }
  } catch (err) {
    if (tempBranch.default) {
      //leaf
      return new PairNotfoundI(nodes, index, tempBranch.default!, currentQuery);
    } else {
      throw err;
    }
  }
}

type PairCommon = {
  nodes: string[];
  index: number;
  query: Readonly<Record<string, any>>;
  currentQuery?: KVPair<any>;
  getAbsolutePath(path: string): string;
};
export type PairLeaf<LeafLoader> = PairCommon & {
  type: 'leaf';
  loader(): Promise<LeafLoader>;
  next?: never;
  load?: never;
};
export type PairNotfound<NotfoundLoader> = PairCommon & {
  type: 'notfound';
  loader(): Promise<NotfoundLoader>;
  next?: never;
  load?: never;
};
export type PairBranch<BranchLoader, LeafLoader, NotfoundLoader> =
  PairCommon & {
    type: 'branch';
    loader(): Promise<BranchLoader>;
    next: PairNode<BranchLoader, LeafLoader, NotfoundLoader>;
    load(
      path: string,
      absolute?: boolean
    ): PairNode<BranchLoader, LeafLoader, NotfoundLoader>;
  };

class AbsPair {
  constructor(
    readonly nodes: string[],
    readonly index: number
  ) {}
  getAbsolutePath(url: string) {
    return joinPath(`/${this.nodes.slice(0, this.index).join('/')}`, url);
  }
}
class PairBranchI<BranchLoader, LeafLoader, NotfoundLoader>
  extends AbsPair
  implements PairBranch<BranchLoader, LeafLoader, NotfoundLoader>
{
  readonly type = 'branch';
  constructor(
    private branch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>,
    nodes: string[],
    index: number,
    readonly next: PairNode<BranchLoader, LeafLoader, NotfoundLoader>,
    readonly currentQuery?: KVPair<any> | undefined
  ) {
    super(nodes, index);
    this.query = next.query;
    this.loader = branch.layout!;
  }
  readonly loader: () => Promise<BranchLoader>;
  readonly query: Readonly<Record<string, any>>;
  /**
   * 全路径节点
   */
  load(
    path: string,
    absolute?: boolean
  ): PairNode<BranchLoader, LeafLoader, NotfoundLoader> {
    if (!absolute) {
      path = this.getAbsolutePath(path);
    }
    return foundInner(
      path.split('/').filter(quote),
      this.index,
      this.branch,
      this.currentQuery
    );
  }
}

class PairLeafI<LeafLoader> extends AbsPair implements PairLeaf<LeafLoader> {
  readonly type = 'leaf';
  constructor(
    nodes: string[],
    index: number,
    readonly loader: () => Promise<LeafLoader>,
    readonly currentQuery?: KVPair<any> | undefined
  ) {
    super(nodes, index);
    this.query = currentQuery?.toObject() || emptyObject;
  }
  readonly query: Readonly<Record<string, any>>;
}

class PairNotfoundI<NotfoundLoader>
  extends AbsPair
  implements PairNotfound<NotfoundLoader>
{
  readonly type = 'notfound';
  constructor(
    nodes: string[],
    index: number,
    readonly loader: () => Promise<NotfoundLoader>,
    readonly currentQuery?: KVPair<any> | undefined
  ) {
    super(nodes, index);
    this.query = currentQuery?.toObject() || emptyObject;
  }
  readonly query: Readonly<Record<string, any>>;
}
export type PairNode<BranchLoader, LeafLoader, NotfoundLoader> =
  | PairBranch<BranchLoader, LeafLoader, NotfoundLoader>
  | PairLeaf<LeafLoader>
  | PairNotfound<NotfoundLoader>;

/**
 * 将路径按/拆分成节点
 * @param pathname
 * @returns
 */
export function getPathNodes(pathname: string, split = '/') {
  pathname = decodeURI(pathname);
  return pathname.split(split).filter(quote);
}
export type MatchRule = (pathNodes: readonly string[]) => void | {
  /**
   * 匹配的nodes
   */
  matchNodes: string[];
  /**
   * 剩余的nodes
   */
  restNodes: string[];
  ignoreMore: boolean;
  /**
   * 嵌套在节点中的查询参数
   */
  query: Record<string, string>;
};
export abstract class RelativeHistory {
  push(v: string) {
    this.push_nodes(getPathNodes(v));
  }
  replace(v: string) {
    this.replace_nodes(getPathNodes(v));
  }
  abstract push_nodes(vs: string[]): void;
  abstract replace_nodes(vs: string[]): void;
}

export class ThisRelativeHistory extends RelativeHistory {
  constructor(
    public readonly parent: RelativeHistory,
    public readonly nodes: string[]
  ) {
    super();
  }
  push_nodes(vs: string[]): void {
    this.parent.push_nodes(this.nodes.concat(vs));
  }
  replace_nodes(vs: string[]): void {
    this.parent.replace_nodes(this.nodes.concat(vs));
  }
}

export class RootRelativeHistory extends RelativeHistory {
  constructor(
    public readonly history: {
      push(st: string): void;
      replace(st: string): void;
    }
  ) {
    super();
  }
  push_nodes(vs: string[]): void {
    this.history.push(`/${vs.join('/')}`);
  }
  replace_nodes(vs: string[]): void {
    this.history.replace(`/${vs.join('/')}`);
  }
}
