import { KVPair } from "../KVPair"
import { emptyArray, emptyObject, Quote, quote } from "../util"
import { matchMatch, MatchNode, toMatchNode } from "./match"



type RouteBranch<BranchLoader, LeafLoader, NotfoundLoader> = {
  //名称
  key: string
  match: MatchNode
  order: number
  //布局页面
  layout?(): Promise<BranchLoader>
  //无子路径页面
  index?(): Promise<LeafLoader>
  //如果所有匹配失败,则转向它
  default?(): Promise<NotfoundLoader>
  children?: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>[]
}
function sortBranch(a: RouteBranch<any, any, any>, b: RouteBranch<any, any, any>) {
  return a.order - b.order
}




export class TreeRoute<BranchLoader, LeafLoader, NotfoundLoader> {
  constructor(
    private typeDefMap: Record<string, (v: string) => any>,
    private transLoader: {
      (x: () => Promise<LeafLoader>): () => Promise<LeafLoader>
      (x: () => Promise<NotfoundLoader>): () => Promise<NotfoundLoader>
      (x: () => Promise<BranchLoader>): () => Promise<BranchLoader>
    } = quote
  ) { }
  private rootBranch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader> = {
    key: "",
    match: "",
    order: 0
  }

  buildFromMap(
    pages: Record<string, () => Promise<any>>,
    prefix: string,
    INDEX = 'index',
    LAYOUT = 'layout',
    DEFAULT = 'default'
  ) {
    for (const key in pages) {
      let queryPath = key.slice(prefix.length, key.lastIndexOf('.'))
      if (queryPath.endsWith(INDEX)) {
        const nodes = queryPath.slice(0, queryPath.length - INDEX.length).split('/').filter(quote)
        const tempBranch = this.buildRoot(nodes)
        tempBranch.index = this.transLoader(pages[key]) as any
      }
      if (queryPath.endsWith(LAYOUT)) {
        const nodes = queryPath.slice(0, queryPath.length - LAYOUT.length).split('/').filter(quote)
        const tempBranch = this.buildRoot(nodes)
        tempBranch.layout = this.transLoader(pages[key]) as any
      }

      if (queryPath.endsWith(DEFAULT)) {
        const nodes = queryPath.slice(0, queryPath.length - DEFAULT.length).split('/').filter(quote)
        const tempBranch = this.buildRoot(nodes)
        tempBranch.default = this.transLoader(pages[key]) as any
      }
    }
  }
  buildRoot(nodes: string[]) {
    let tempBranch = this.rootBranch
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (!tempBranch.children) {
        tempBranch.children = []
      }
      let subBranch = tempBranch.children.find(x => x.key == node)
      if (!subBranch) {
        const sp = node.split('.')
        let order = 0
        let match = node
        if (sp.length > 1) {
          order = Number(sp[0])
          if (isNaN(order)) {
            order = 0
          } else {
            sp.shift()
            match = sp.join('.')
          }
        }
        subBranch = {
          key: node,
          match: toMatchNode(match, this.typeDefMap),
          order
        }
        tempBranch.children.push(subBranch)
      }
      tempBranch = subBranch
    }
    return tempBranch
  }

  private sort(vs: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>[]) {
    vs.sort(sortBranch)
    for (let i = 0; i < vs.length; i++) {
      const children = vs[i].children
      if (children) {
        this.sort(children)
      }
    }
  }
  finishBuild() {
    const rootChildren = this.rootBranch.children
    if (rootChildren) {
      this.sort(rootChildren)
    }
    return rootChildren
  }
  matchNodes(nodes: string[]) {
    let ret = this.buildBranch(nodes, 0, this.rootBranch, undefined)
    return ret
  }
  private buildBranch(
    nodes: string[],
    index: number,
    branch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>,
    currentQuery?: KVPair<any>
  ): PairNode<BranchLoader, LeafLoader, NotfoundLoader> {
    const ret = this.foundInner(nodes, index, branch, currentQuery)
    if (branch.layout) {
      return {
        nodes,
        index,
        type: "branch",
        loader: (branch.layout!),
        currentQuery,
        next: ret,
        query: ret.query,
        load: (nodes) => {
          return this.foundInner(nodes, index, branch, currentQuery)
        }
      }
    }
    return ret
  }
  private foundInner(
    nodes: string[],
    index: number,
    tempBranch: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader>,
    currentQuery: KVPair<any> | undefined
  ): PairNode<BranchLoader, LeafLoader, NotfoundLoader> {
    try {
      if (index == nodes.length) {
        //叶子节点
        if (tempBranch.index) {
          return {
            nodes,
            type: "leaf",
            index,
            loader: (tempBranch.index!),
            currentQuery,
            query: currentQuery?.toObject() || emptyObject
          }
        } else {
          throw new Error('not found')
        }
      } else if (tempBranch.children) {
        //枝节点
        const node = nodes[index]
        let foundMath: RouteBranch<BranchLoader, LeafLoader, NotfoundLoader> | undefined = undefined
        for (let i = 0; i < tempBranch.children.length && !foundMath; i++) {
          const cacheTempBranch = tempBranch.children[i]
          const match = cacheTempBranch.match
          try {
            currentQuery = matchMatch(node, match, currentQuery)
            foundMath = cacheTempBranch
          } catch (err) { }
        }
        if (foundMath) {
          return this.buildBranch(
            nodes,
            index + 1,
            foundMath,
            currentQuery
          )
        } else {
          throw new Error('not found')
        }
      } else {
        throw new Error('not found')
      }
    } catch (err) {
      if (tempBranch.default) {
        //leaf
        return {
          nodes,
          type: "notfound",
          loader: (tempBranch.default!),
          currentQuery,
          index,
          // restNodes: nodes.slice(index),
          query: currentQuery?.toObject() || emptyObject
        }
      } else {
        throw err
      }
    }
  }
}

export type PairLeaf<LeafLoader> = {
  nodes: string[]
  type: "leaf"
  index: number
  loader(): Promise<LeafLoader>
  next?: never
  query: Readonly<Record<string, any>>
  currentQuery?: KVPair<any>
  // restNodes?: never
  load?: never
}
export type PairNotfound<NotfoundLoader> = {
  nodes: string[]
  index: number
  type: "notfound"
  loader(): Promise<NotfoundLoader>
  next?: never
  query: Readonly<Record<string, any>>
  currentQuery?: KVPair<any>
  // restNodes: string[]
  load?: never
}
export type PairBranch<BranchLoader, LeafLoader, NotfoundLoader> = {
  nodes: string[]
  type: "branch"
  index: number
  loader(): Promise<BranchLoader>
  next: PairNode<BranchLoader, LeafLoader, NotfoundLoader>
  query: Readonly<Record<string, any>>
  currentQuery?: KVPair<any>
  // restNodes?: never
  load(ns: string[]): PairNode<BranchLoader, LeafLoader, NotfoundLoader>
}

export type PairNode<BranchLoader, LeafLoader, NotfoundLoader> = PairBranch<BranchLoader, LeafLoader, NotfoundLoader> | PairLeaf<LeafLoader> | PairNotfound<NotfoundLoader>

/**
 * 将路径按/拆分成节点
 * @param pathname 
 * @returns 
 */
export function getPathNodes(pathname: string, split = '/') {
  pathname = decodeURI(pathname)
  return pathname.split(split).filter(quote)
}
export type MatchRule = (pathNodes: readonly string[]) => void | {
  /**
   * 匹配的nodes
   */
  matchNodes: string[]
  /**
   * 剩余的nodes
   */
  restNodes: string[]
  ignoreMore: boolean
  /**
   * 嵌套在节点中的查询参数
   */
  query: Record<string, string>
}
export abstract class RelativeHistory {
  push(v: string) {
    this.push_nodes(getPathNodes(v))
  }
  replace(v: string) {
    this.replace_nodes(getPathNodes(v))
  }
  abstract push_nodes(vs: string[]): void
  abstract replace_nodes(vs: string[]): void
}

export class ThisRelativeHistory extends RelativeHistory {
  constructor(
    public readonly parent: RelativeHistory,
    public readonly nodes: string[]
  ) {
    super();
  }
  push_nodes(vs: string[]): void {
    this.parent.push_nodes(this.nodes.concat(vs))
  }
  replace_nodes(vs: string[]): void {
    this.parent.replace_nodes(this.nodes.concat(vs))
  }
}

export class RootRelativeHistory extends RelativeHistory {
  constructor(
    public readonly history: {
      push(st: string): void
      replace(st: string): void
    }
  ) {
    super()
  }
  push_nodes(vs: string[]): void {
    this.history.push('/' + vs.join('/'))
  }
  replace_nodes(vs: string[]): void {
    this.history.replace('/' + vs.join('/'))
  }
}