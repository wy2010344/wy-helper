import { KVPair } from "../KVPair"
import { emptyObject, Quote, quote } from "../util"
import { matchMatch, MatchNode, toMatchNode } from "./match"



type RouteBranch<BranchLoader, LeafLoader, MoreLoader> = {
  //名称
  key: string
  match: MatchNode
  order: number
  //布局页面
  layout?(): Promise<BranchLoader>
  //无子路径页面
  index?(): Promise<LeafLoader>
  //如果所有匹配失败,则转向它
  default?(): Promise<MoreLoader>
  children?: RouteBranch<BranchLoader, LeafLoader, MoreLoader>[]
}
function sortBranch(a: RouteBranch<any, any, any>, b: RouteBranch<any, any, any>) {
  return a.order - b.order
}




export class TreeRoute<BranchLoader, LeafLoader, MoreLoader> {
  constructor(
    private typeDefMap: Record<string, (v: string) => any>
  ) { }
  private rootBranch: RouteBranch<BranchLoader, LeafLoader, MoreLoader> = {
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
        tempBranch.index = pages[key] as any
      }
      if (queryPath.endsWith(LAYOUT)) {
        const nodes = queryPath.slice(0, queryPath.length - LAYOUT.length).split('/').filter(quote)
        const tempBranch = this.buildRoot(nodes)
        tempBranch.layout = pages[key] as any
      }

      if (queryPath.endsWith(DEFAULT)) {
        const nodes = queryPath.slice(0, queryPath.length - DEFAULT.length).split('/').filter(quote)
        const tempBranch = this.buildRoot(nodes)
        tempBranch.default = pages[key] as any
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

  private sort(vs: RouteBranch<BranchLoader, LeafLoader, MoreLoader>[]) {
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
    const branches: BranchWithQuery<BranchLoader, LeafLoader, MoreLoader>[] = [
      {
        branch: this.rootBranch
      }
    ]
    let tempBranch = this.rootBranch
    let query: KVPair<any> | undefined = undefined

    let findDefault = false
    for (let i = 0; i < nodes.length && !findDefault; i++) {
      const node = nodes[i]
      try {
        if (tempBranch.children) {
          //寻找匹配的分支
          let foundMath: RouteBranch<BranchLoader, LeafLoader, MoreLoader> | undefined = undefined
          for (let i = 0; i < tempBranch.children.length && !foundMath; i++) {
            const cacheTempBranch = tempBranch.children[i]
            const match = cacheTempBranch.match
            try {
              query = matchMatch(node, match, query)
              foundMath = cacheTempBranch
            } catch (err) { }
          }
          if (foundMath) {
            //@todo 这里,递进尝试,失败了,并不会返回上一处栈,最好使用递归
            branches.push({
              branch: foundMath,
              query
            })
            tempBranch = foundMath
          } else {
            throw new Error('not found')
          }
        } else {
          throw new Error('not found')
        }
      } catch (err) {
        if (tempBranch.default) {
          branches.push({
            branch: tempBranch,
            query,
            restNodes: nodes.slice(i)
          })
          findDefault = true
        } else {
          throw err
        }
      }
    }
    return branches
  }
}


type BranchWithQuery<BranchLoader, LeafLoader, MoreLoader> = {
  branch: RouteBranch<BranchLoader, LeafLoader, MoreLoader>
  query?: KVPair<any> | undefined
  restNodes?: string[]
}
export type PairLeaf<LeafLoader> = {
  default?: never
  index(): Promise<LeafLoader>
  layout?: never
  next?: never
  query: Readonly<Record<string, any>>
  restNodes?: never
}
export type PairMore<MoreLoader> = {
  index?: never
  default(): Promise<MoreLoader>
  layout?: never
  next?: never
  query: Readonly<Record<string, any>>
  restNodes: string[]
}
export type PairBranch<BranchLoader, LeafLoader, MoreLoader> = {
  default?: never
  index?: never
  layout(): Promise<BranchLoader>
  next: PairBranch<BranchLoader, LeafLoader, MoreLoader> | PairLeaf<LeafLoader> | PairMore<MoreLoader>
  query: Readonly<Record<string, any>>
  restNodes?: never
}

export function branchesToPairs<BranchLoader, LeafLoader, MoreLoader>(branches: BranchWithQuery<BranchLoader, LeafLoader, MoreLoader>[], trans: <T>(v: T) => T = quote) {
  const lastBranch = branches.at(-1)
  if (!lastBranch) {
    throw new Error('至少需要一个节点')
  }
  const query = lastBranch.query?.toObject() || emptyObject

  let last: PairLeaf<LeafLoader> | PairMore<MoreLoader>
  if (lastBranch.restNodes) {
    last = {
      default: trans(lastBranch.branch.default!),
      query,
      restNodes: lastBranch.restNodes
    }
  } else {
    last = {
      index: trans(lastBranch.branch.index!),
      query
    }
  }
  let ret: PairBranch<BranchLoader, LeafLoader, MoreLoader> | PairLeaf<LeafLoader> | PairMore<MoreLoader> = last
  for (let i = branches.length - 1; i > -1; i--) {
    const branch = branches[i]
    if (branch.branch.layout) {
      //新增一个layout
      ret = {
        next: ret,
        layout: trans(branch.branch.layout),
        query
      }
    }
  }
  return ret
}
/**
 * 格式
 *  /xxx/aa 匹配/xxx/aa
 *  /xxx/[ab]-bc-[dd]/[bc]/... 这种规则其实有点类似于prolog
 *     先要解析出规则,还要依规则去解析具体内容
 *  /xxx/aa/... 匹配/xxx/aa及其之后
 * @param queryPath 
 * @param startWith 
 * @returns 
 */
export function locationMatch(
  queryPath: string,
  typeDefMap: Record<string, (v: string) => any> = emptyObject
): MatchRule {
  let queryNodes = queryPath.split('/').filter(quote)
  let ignoreMore = false
  if (queryNodes.at(-1) == '...') {
    queryNodes.pop()
    ignoreMore = true
  }
  const rules = queryNodes.map(node => {
    return toMatchNode(node, typeDefMap)
  })
  return function (_nodes: readonly string[]) {
    const nodes = _nodes.slice()
    const restNodes: string[] = []
    if (ignoreMore) {
      while (nodes.length > queryNodes.length) {
        restNodes.unshift(nodes.pop()!)
      }
    }
    if (nodes.length == rules.length) {
      let queryObj: KVPair<any> | undefined = undefined
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const query = rules[i]
        try {
          queryObj = matchMatch(node, query, queryObj)
        } catch {
          return
        }
      }
      return {
        ignoreMore,
        query: queryObj?.toObject() || emptyObject,
        restNodes,
        matchNodes: nodes
      }
    }
  }
}


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