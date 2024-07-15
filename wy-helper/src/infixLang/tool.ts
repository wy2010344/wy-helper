import { KVar, list } from "../kanren"
import {
  Que,
  or,
  ruleGetString,
  skipAnyString,
  skipMatchEnd
} from "../tokenParser"
import { EmptyFun } from "../util"
import {
  Infix, InfixConfig, InfixToken, MatchGet, parseInfix,
} from './parseInfix'

function manageInfixLib(
  array: InfixConfig[],
  maxX: number,
  get: MatchGet
) {
  const betweenExp: string[] = []
  const theMatch = get.match
  for (let x = 0; x < maxX; x++) {
    const vs = array[x]
    const cs = Array.isArray(vs) ? vs : vs.values
    for (let y = 0; y < cs.length; y++) {
      const v = cs[y]
      if (typeof v == 'string') {
        if (theMatch(new Que(v))) {
          betweenExp.push(v)
        }
      }
    }
  }
  const row = array[maxX]
  const cs = Array.isArray(row) ? row : row.values
  for (const v of cs) {
    if (typeof v == 'string') {
      if (theMatch(new Que(v))) {
        console.warn("同极包含可覆盖元素", v)
      }
    }
  }

  if (betweenExp.length) {
    return {
      ...get,
      match(que: Que) {
        const after = theMatch(que)
        if (after) {
          const value = ruleGetString(que, after)
          if (betweenExp.includes(value)) {
            return
          }
        }
        return after
      }
    }
  }
  return get
}

function buildOneInfix(row: Infix[], array: InfixConfig[], x: number) {
  return row.map((cell, y) => {
    if (typeof cell == 'string') {
      return cell
    } else {
      return manageInfixLib(array, x, cell)
    }
  })
}
function buildInfixLibArray(array: InfixConfig[]) {
  return array.map((row, x) => {
    if (Array.isArray(row)) {
      return buildOneInfix(row, array, x)
    } else {
      return {
        ...row,
        values: buildOneInfix(row.values, array, x)
      }
    }
  })
}

export function buildInfix<T>(
  array: InfixConfig[],
  skipWhiteSpace: EmptyFun,
  parseLeafNode: () => T,
  build: (infix: InfixToken, left: T, right: T) => T
) {
  const newList = buildInfixLibArray(array)
  function parseEndNode(): T {
    const node = or([
      parseLeafNode,
      () => {
        skipAnyString('(')
        skipWhiteSpace()
        const value = parseNode()
        skipWhiteSpace()
        skipAnyString(')')
        return value
      }
    ], 'end-node')
    return node as any
  }
  const neAs = list(...newList)
  function parseNode() {
    return parseInfix(neAs, skipWhiteSpace, parseEndNode, build)
  }


  function getInfixOrder(n: string): [number, string, boolean] {
    for (let i = newList.length - 1; i > -1; i--) {
      const row = newList[i]
      let rev = !Array.isArray(row)
      const vs = Array.isArray(row) ? row : row.values
      for (let x = 0; x < vs.length; x++) {
        const cell = vs[x]
        if (cell == n) {
          return [i, n, rev]
        } else if (typeof cell == 'object') {
          if (cell.match(new Que(n))) {
            return [i, cell.stringify(n), rev]
          }
        }
      }
    }
    throw new Error("unfind the infix order")
  }

  return {
    parseNode,
    parseSentence() {
      skipWhiteSpace()
      let node = parseNode()
      skipWhiteSpace()
      skipMatchEnd()
      return node
    },
    getInfixOrder,
  }
}

export type BaseDisplayT = {
  // type:  "white"|"keyword"
  value: string
  begin: number
  end: number
}

export type InfixNode<T> = {
  type: "infix"
  infix: InfixToken
  left: InfixEndNode<T>
  right: InfixEndNode<T>
}

export type InfixEndNode<T> = T | InfixNode<T>

function isInfixNode<T extends { type: string }>(endNode: T | InfixNode<T>): endNode is InfixNode<T> {
  return endNode.type == 'infix'
}
function endNodeToToken<
  T extends { type: string },
  F extends BaseDisplayT
>(
  endNode: T | InfixNode<T>,
  list: F[],
  getOther: (n: T) => F,
  getInfix: (n: BaseDisplayT) => F
) {
  if (isInfixNode(endNode)) {
    endNodeToToken(endNode.left, list, getOther, getInfix)
    list.push(getInfix({
      value: endNode.infix.value,
      begin: endNode.infix.begin,
      end: endNode.infix.end
    }))
    endNodeToToken(endNode.right, list, getOther, getInfix)
  } else {
    list.push(getOther(endNode))
  }
}


export function endNotFillToToken<
  T extends { type: string },
  F extends BaseDisplayT>(
    getOther: (n: T) => F,
    getInfix: (n: BaseDisplayT) => F,
    getWhite: (n: BaseDisplayT) => F
  ) {
  return function (
    endNode: T | InfixNode<T>,
    text: string
  ) {

    const list: F[] = []
    endNodeToToken(endNode, list, getOther, getInfix)
    let i = 0
    while (i < list.length - 1) {
      const row = list[i]
      const nextRow = list[i + 1]
      if (row.end != nextRow.begin) {
        list.splice(i + 1, 0, getWhite({
          value: text.slice(row.end, nextRow.begin),
          begin: row.end,
          end: nextRow.begin
        }))
        i = i + 2
      } else {
        i = i + 1
      }
    }
    const first = list[0]
    if (first && first.begin != 0) {
      list.unshift(getWhite({
        value: text.slice(0, first.begin),
        begin: 0,
        end: first.begin
      }))
    }
    const last = list.at(-1)
    if (last && last.end != text.length) {
      list.push(getWhite({
        value: text.slice(last.end, text.length),
        begin: last.end,
        end: text.length
      }))
    }
    return list
  }
}


export class VarPool {
  constructor(
    private readonly parent?: VarPool
  ) { }
  size() {
    return this.pool.size
  }
  private pool: Map<string, KVar> = new Map()

  /**
   * 
   * @param key 
   * @param arg 参数部分的渲染,即本作用域增加新的去覆盖
   * @returns 
   */
  get(key: string, arg?: boolean) {
    if (key == "_") {
      return KVar.create()
    }
    let oldVar = this.pool.get(key)
    if (!arg) {
      if (!oldVar) {
        let parent = this.parent
        while (parent && !oldVar) {
          oldVar = parent.pool.get(key)
          parent = parent.parent
        }
      }
    }
    //临时创建
    if (!oldVar) {
      oldVar = KVar.create()
      this.pool.set(key, oldVar)
    }
    return oldVar
  }
  forEach(callback: (value: KVar, key: string) => void) {
    this.pool.forEach(callback)
  }
}