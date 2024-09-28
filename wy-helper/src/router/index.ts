import { quote } from "../util"

/**
 * 将路径按/拆分成节点
 * @param pathname 
 * @returns 
 */
export function getPathNodes(pathname: string, split = '/') {
  pathname = decodeURI(pathname)
  return pathname.split(split).filter(quote)
}
class MatchNode {
  constructor(
    public readonly before: string,
    public readonly key: string,
    public readonly after: string,
    public readonly type: string
  ) { }
  match(query: string) {
    if (query.startsWith(this.before) && query.endsWith(this.after)) {
      const value = query.slice(
        query.indexOf(this.before) + this.before.length,
        query.lastIndexOf(this.after))
      if (this.type == 'number') {
        return Number(value)
      } else if (this.type == "min-1") {
        if (value.length < 1) {
          return
        }
      }
      return value
    }
  }
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
export function locationMatch(queryPath: string): MatchRule {
  let queryNodes = queryPath.split('/').filter(quote)
  let ignoreMore = false
  if (queryNodes.at(-1) == '...') {
    queryNodes.pop()
    ignoreMore = true
  }
  const rules = queryNodes.map(node => {
    const idx1 = node.indexOf('[')
    if (idx1 < 0) {
      return node
    }
    const idx2 = node.indexOf(']')
    if (idx1 < idx2) {
      const before = node.slice(0, idx1)
      const varDef = node.slice(idx1 + 1, idx2).split(':')
      const after = node.slice(idx2 + 1)
      return new MatchNode(before, varDef[0], after, varDef[1])
    }
    throw new Error("变量区域需要匹配的]")
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
      let queryObj: Record<string, any> = {}
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const query = rules[i]
        if (query instanceof MatchNode) {
          const value = query.match(node)
          if (typeof value != 'undefined') {
            queryObj[query.key] = value
          } else {
            return
          }
        } else if (node != query) {
          return
        }
      }
      return {
        ignoreMore,
        query: queryObj,
        restNodes,
        matchNodes: nodes
      }
    }
  }
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