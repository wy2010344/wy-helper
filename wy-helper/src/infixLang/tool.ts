import { KVar, list } from '../kanren'
import {
  getCurrentQue,
  ParseFun,
  Que,
  ruleGetString,
  runParse,
  skipAnyString,
  skipMatchEnd,
} from '../tokenParser'
import { EmptyFun } from '../util'
import { InfixConfig, parseInfix } from './parseInfix'

// function manageInfixLib(
//   array: SimpleInfixArray[],
//   maxX: number,
//   get: MatchGet
// ) {
//   const betweenExp: string[] = []
//   const theMatch = get.match
//   for (let x = 0; x < maxX; x++) {
//     const vs = array[x]
//     const cs = Array.isArray(vs) ? vs : vs.values
//     for (let y = 0; y < cs.length; y++) {
//       const v = cs[y]
//       if (typeof v == 'string') {
//         if (theMatch(new Que(v))) {
//           betweenExp.push(v)
//         }
//       }
//     }
//   }
//   const row = array[maxX]
//   const cs = Array.isArray(row) ? row : row.values
//   for (const v of cs) {
//     if (typeof v == 'string') {
//       if (theMatch(new Que(v))) {
//         console.warn('同极包含可覆盖元素', v)
//       }
//     }
//   }

//   if (betweenExp.length) {
//     return {
//       ...get,
//       match(que: Que) {
//         const after = theMatch(que)
//         if (after) {
//           const value = ruleGetString(que, after)
//           if (betweenExp.includes(value)) {
//             return
//           }
//         }
//         return after
//       },
//     }
//   }
//   return get
// }

export type MatchGet<T> = {
  parse(): T
  // match: ParseFun<Que>
  // get?(originalValue: string, begin: Que, end: Que): string
  // display: string
  stringify?(n: string): string
  match(n: any): any
}
type SimpleInfixNode<T> = string | MatchGet<T>
type SimpleInfixArray<T> =
  | SimpleInfixNode<T>[]
  | {
      type: 'rev'
      values: SimpleInfixNode<T>[]
    }
export function toInfixConfig<T>(
  newList: SimpleInfixArray<T>[],
  strInValue: (begin: number, value: string, end: number) => T
) {
  function simpleToArray(row: SimpleInfixNode<T>[]) {
    return row.map((cell) => {
      if (typeof cell == 'string') {
        return function () {
          const begin = getCurrentQue()!.i
          skipAnyString(cell)
          const end = getCurrentQue()!.i
          return strInValue(begin, cell, end)
        }
      } else {
        return cell.parse
      }
    })
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
          if (cell.match(n)) {
            return [i, cell.stringify ? cell.stringify(n) : n, rev]
          }
        }
      }
    }
    throw new Error('unfind the infix order')
  }
  return {
    getInfixOrder,
    array: newList.map<InfixConfig<T>>((row) => {
      if (Array.isArray(row)) {
        return simpleToArray(row)
      } else {
        return {
          ...row,
          values: simpleToArray(row.values),
        }
      }
    }),
  }
}
export function buildInfix<T, I>(
  array: InfixConfig<I>[],
  skipWhiteSpace: EmptyFun,
  build: (infix: I, left: T, right: T) => T
) {
  const vs = list(...array)
  function parseNode(parseLeafNode: () => T) {
    return parseInfix(vs, skipWhiteSpace, parseLeafNode, build)
  }
  return {
    parseNode,
    parseSentence(parseLeafNode: () => T) {
      skipWhiteSpace()
      let node = parseNode(parseLeafNode)
      skipWhiteSpace()
      skipMatchEnd()
      return node
    },
    parseQuoteLeaf(parseLeafNode: () => T, begin: string, end = begin) {
      skipAnyString(begin)
      skipWhiteSpace()
      const value = parseNode(parseLeafNode)
      skipWhiteSpace()
      skipAnyString(end)
      return value
    },
  }
}

export type BaseDisplayT = {
  // type:  "white"|"keyword"
  value: string
  begin: number
  end: number
}

export type InfixNode<T, I> = {
  type: 'infix'
  infix: I
  left: InfixEndNode<T, I>
  right: InfixEndNode<T, I>
}

export type InfixEndNode<T, I> = T | InfixNode<T, I>

function isInfixNode<T extends { type: string }, I>(
  endNode: T | InfixNode<T, I>
): endNode is InfixNode<T, I> {
  return endNode.type == 'infix'
}

export function endNotFillToToken<
  T extends { type: string },
  I,
  F extends BaseDisplayT
>(
  getOther: (
    n: T,
    list: F[],
    parseSelf: (endNode: T | InfixNode<T, I>) => void
  ) => void,
  getInfix: (
    n: I,
    list: F[],
    parseSelf: (endNode: T | InfixNode<T, I>) => void
  ) => void,
  getWhite: (n: BaseDisplayT) => F
) {
  return function (endNode: T | InfixNode<T, I>, text: string, list: F[] = []) {
    function endNodeToToken(endNode: T | InfixNode<T, I>) {
      if (isInfixNode(endNode)) {
        endNodeToToken(endNode.left)
        getInfix(endNode.infix, list, endNodeToToken)
        endNodeToToken(endNode.right)
      } else {
        getOther(endNode, list, endNodeToToken)
      }
    }
    endNodeToToken(endNode)
    let i = 0
    while (i < list.length - 1) {
      const row = list[i]
      const nextRow = list[i + 1]
      if (row.end != nextRow.begin) {
        list.splice(
          i + 1,
          0,
          getWhite({
            value: text.slice(row.end, nextRow.begin),
            begin: row.end,
            end: nextRow.begin,
          })
        )
        i = i + 2
      } else {
        i = i + 1
      }
    }
    const first = list[0]
    if (first && first.begin != 0) {
      list.unshift(
        getWhite({
          value: text.slice(0, first.begin),
          begin: 0,
          end: first.begin,
        })
      )
    }
    const last = list.at(-1)
    if (last && last.end != text.length) {
      list.push(
        getWhite({
          value: text.slice(last.end, text.length),
          begin: last.end,
          end: text.length,
        })
      )
    }
    return list
  }
}

export class VarPool {
  constructor(private readonly parent?: VarPool) {}
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
    if (key == '_') {
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
