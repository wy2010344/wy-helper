import { List } from "../kanren"
import { EmptyFun, emptyFun } from "../util"
import { or, parseGet } from "../tokenParser/parse"
import { ParseFun, Que, matchAnyString } from "../tokenParser/tokenParser"


export interface InfixToken {
  begin: number
  end: number
  value: string
}
export type InfixNode<T> = {
  type: "infix"
  infix: InfixToken
  left: InfixEndNode<T>
  right: InfixEndNode<T>
}

export type InfixEndNode<T> = T | InfixNode<T>

export type MatchGet = {
  match: ParseFun<Que>
  get(begin: Que, end: Que): string
  display: string
  stringify(n: string): string
}

export type Infix = string | MatchGet
/**
 * 从后往前结合
 */
export type RevInfix = {
  type: "rev",
  values: Infix[]
}
export type InfixConfig = Infix[] | RevInfix
function parseInfixBB<F>(
  parseLeaf: () => F,
  infixes: Infix[],
  skipWhiteSpace: EmptyFun
) {
  const first = parseLeaf()
  const exts = parsePrefix(infixes, parseLeaf, skipWhiteSpace)
  return { first, exts }
}

function parseInfixNode(value: MatchGet) {
  return function () {
    return parseGet(value.match, (begin, end) => {
      const str = value.get(begin, end)
      return {
        value: str,
        begin: begin.i,
        end: end.i,
        errors: []
      } as InfixToken
    })
  }
}
function parseInfixStr(value: string) {
  return () => {
    return parseGet(matchAnyString(value), (begin, end) => {
      return {
        value: begin.content.slice(begin.i, end.i),
        begin: begin.i,
        end: end.i
      } as InfixToken
    })
  }
}
function parsePrefix<F>(
  infixes: Infix[],
  parseLeaf: () => F,
  skipWhiteSpace: EmptyFun
) {
  const exts: {
    infix: InfixToken
    value: F
  }[] = []
  while (true) {
    const hasValue = or([
      () => {
        skipWhiteSpace()
        const infix = or(infixes.map(value => {
          if (typeof value == 'string') {
            return parseInfixStr(value)
          } else {
            return parseInfixNode(value)
          }
        }))
        skipWhiteSpace()
        const right = parseLeaf()//
        exts.push({
          infix,
          value: right
        })
        return true
      },
      emptyFun
    ], `infix:${infixes.map(v => {
      if (typeof v == 'string') {
        return v
      } else {
        return v.display
      }
    }).join(' ')}`)
    if (!hasValue) {
      break
    }
  }
  return exts
}

/**
 * 未经测试
 * @param infixes 
 * @param parseLeaf 
 * @returns 
 */
export function parseSuffix<F>(
  infixes: Infix[],
  parseLeaf: () => F,
  skipWhiteSpace: EmptyFun
) {
  const exts: {
    value: F
    infix: InfixToken
  }[] = []
  while (true) {
    const hasValue = or([
      () => {
        skipWhiteSpace()
        const right = parseLeaf()//
        skipWhiteSpace()
        const infix = or(infixes.map(value => {
          if (typeof value == 'string') {
            return parseInfixStr(value)
          } else {
            return parseInfixNode(value)
          }
        }))
        exts.push({
          infix,
          value: right
        })
        return true
      },
      emptyFun
    ], `infix:${infixes.map(v => {
      if (typeof v == 'string') {
        return v
      } else {
        return v.display
      }
    }).join(' ')}`)
    if (!hasValue) {
      break
    }
  }
  return exts
}

/**
 * 左结合
 * @param parseLeaf 
 * @param value 
 */
export function parseInfixBLeft<F, T>(
  parseLeaf: () => F,
  infixes: Infix[],
  skipWhiteSpace: EmptyFun,
  build: (infix: InfixToken, left: F | T, right: F) => T
) {
  const { first, exts } = parseInfixBB(parseLeaf, infixes, skipWhiteSpace)
  let value = first as F | T
  for (let i = 0; i < exts.length; i++) {
    const ext = exts[i]
    value = build(ext.infix, value, ext.value)
  }
  return value
}
/**
 * 右结合
 * @param parseLeaf 
 * @param value 
 */
export function parseInfixBRight<F, T>(
  parseLeaf: () => F,
  infixes: Infix[],
  skipWhiteSpace: EmptyFun,
  build: (infix: InfixToken, left: F, right: F | T) => T
) {
  const { first, exts } = parseInfixBB(parseLeaf, infixes, skipWhiteSpace)
  if (exts.length) {
    let { value: tmpValue, infix } = exts[exts.length - 1]
    let value = tmpValue as F | T
    for (let i = exts.length - 2; i > -1; i--) {
      const ext = exts[i]
      value = build(infix, ext.value, value)
      infix = ext.infix
    }
    value = build(infix, first, value)
    return value
  }
  return first
}
/**
 * 默认是向后组装的
 * 但需要向前组装
 * @param infixs 
 * @param parseNode 
 * @returns 
 */
export function parseInfix<T>(
  infixes: List<InfixConfig>,

  skipWhiteSpace: EmptyFun,
  parseNode: () => T
): InfixEndNode<T> {
  if (!infixes) {
    return parseNode()
  }
  const c = infixes.left
  const parseLeaf = () => parseInfix(infixes.right, skipWhiteSpace, parseNode)
  if (Array.isArray(c)) {
    return parseInfixBLeft(
      parseLeaf,
      c,
      skipWhiteSpace,
      (infix, left, right) => {
        return {
          type: "infix",
          infix,
          left,
          right
        }
      }
    )
  } else {
    return parseInfixBRight(
      parseLeaf,
      c.values,
      skipWhiteSpace,
      (infix, left, right) => {
        return {
          type: "infix",
          infix,
          left,
          right
        }
      }
    )
  }
}

/**
 * 
 * @param pOrder 父层级的order
 * @param order 自身的order
 * @param onLeft 自身在父层级是否是左边
 * @returns 
 */
export function infixRightNeedQuote(
  pOrder: number,
  order: number,
  onLeft?: boolean
) {
  if (pOrder > order) {
    return true
  } else if (pOrder < order) {
    return false
  } else
    if (onLeft) {
      return true
    } else {
      return false
    }
}
// export type AInfixNode<T> = {
//   type: "infix"
//   infix: InfixToken
//   left: AllEndNode<T>
//   right: AllEndNode<T>
// }
// export type APrefixNode<T> = {
//   type: "prefix"
//   prefix: InfixToken
//   value: AllEndNode<T>
// }
// export type ASuffixNode<T> = {
//   type: "suffix"
//   suffix: InfixToken
//   value: AllEndNode<T>
// }
// type AllEndNode<T> = T | InfixNode<T> | APrefixNode<T> | ASuffixNode<T>
// export function parseAll<T>() {

// }
/**
 * A + nil = A;
(H:A) + B = (H:C) :- A + B = C;
ni
 * @param v
 * @returns
 */
/**
 * va = x -> ab:98;
ac = y -> x -> f -> f:x:y
 */

// export type InfixSimplify = [
//   InfixSimplify,
//   string,
//   InfixSimplify
// ] | string | number

// /**
//  * 如果子成员都是纯值,则不换行
//  * 如果有一个子成员不是,则换行
//  * @param v 
//  * @returns 
//  */
// export function logInfixSimplify(v: InfixSimplify, indent = 0): string {
//   if (Array.isArray(v)) {
//     const vs = v.map(x => logInfixSimplify(x))
//     if (v.every(v => !Array.isArray(v))) {
//       return `[${vs.join(' ')}]`
//     } else {
//       return `[${vs.join(' ')}]`
//     }
//   } else {
//     return v + ""
//   }
// }