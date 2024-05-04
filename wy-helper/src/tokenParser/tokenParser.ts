import { emptyFun, quote } from "../util";


export type Match<V> = (v: V) => boolean

export abstract class BaseQue<V> {
  constructor(
    public readonly i: number
  ) { }
  allowLog?: boolean
  abstract current(): V | void
  abstract notEnd(): boolean
  abstract copyTo(i: number): this
  step1(match: Match<V>): this | void {
    if (this.notEnd()) {
      if (match(this.current()!)) {
        return this.copyTo(this.i + 1)
      }
    }
  }
}

export class Que extends BaseQue<string> {
  constructor(
    public readonly content: string,
    i: number = 0
  ) {
    super(i)
  }
  current(): string | void {
    const c = this.content.charAt(this.i)
    if (c.length) {
      return c
    }
  }
  notEnd(): boolean {
    return this.content.length > this.i
  }
  /**
   * 如果
   * @returns 
   */
  currentCode() {
    return this.content.charCodeAt(this.i)
  }

  copyTo(i: number) {
    return new Que(this.content, i) as this
  }
  /**
   * 匹配到这些字眼,提前进入结束
   * @param vs 
   * @returns 
   */
  matchToEnd(vs: string[]) {
    if (this.notEnd()) {
      for (const v of vs) {
        if (this.content.startsWith(v, this.i)) {
          return void 0;
        }
      }
    }
    return this
  }
  step1Code(callback: (v: number) => boolean) {
    return this.step1(v => {
      return callback(v.charCodeAt(0))
    })
  }
}
/**
 * 解析,如果解析成功,返回正数.解析失败,返回负数
 * 这里不处理错误.
 */
export type ParseFun<Q extends BaseQue<any>> = (que: Q) => (Q | void)
export function matchAnyString<Q extends Que>(...vs: string[]): ParseFun<Q> {
  if (vs.length == 0) {
    throw new Error("没有任何参数")
  }
  for (let x = 0; x < vs.length; x++) {
    const v = vs[x]
    for (let y = 0; y < x; y++) {
      const bv = vs[y]
      if (v.startsWith(bv)) {
        console.warn("后文包含前文,绝不会被匹配到", v, bv)
      }
    }
  }
  return function (que) {
    for (const v of vs) {
      if (que.content.indexOf(v, que.i) == que.i) {
        return que.copyTo(que.i + v.length) as Q
      }
    }
  }
}

export function stringToCharCode(v: string) {
  const vs: number[] = []
  for (let i = 0; i < v.length; i++) {
    vs.push(v.charCodeAt(i))
  }
  return vs
}
export function matchCharIn(...vs: number[]) {
  const set = new Set(vs)
  if (set.size == 0) {
    throw new Error("没有任何参数")
  }
  if (set.size != vs.length) {
    console.warn("参数中有重复", vs)
  }
  return (que: Que) => {
    return que.step1Code(c => {
      for (const v of set) {
        if (c == v) {
          return true
        }
      }
      return false
    })
  }
}
export function matchCharNotIn(...vs: number[]): ParseFun<Que> {
  const set = new Set(vs)
  if (set.size != vs.length) {
    console.warn("参数中有重复", vs)
  }
  return (que: Que) => {
    return que.step1Code(c => {
      for (const v of set) {
        if (c == v) {
          return false
        }
      }
      return true
    })
  }
}

/**
 * 遇到这些字,进入结束
 * @param vs 
 * @returns 
 */
export function matchToEnd<Q extends Que>(...vs: string[]): ParseFun<Q> {
  return function (que) {
    return que.matchToEnd(vs)
  }
}

export function matchEnd<Q extends BaseQue<any>>(que: Q) {
  return que.notEnd() ? undefined : que
}

export function orMatch(...rules: ParseFun<any>[]) {
  return function <Q extends Que>(que: Q) {
    for (const rule of rules) {
      const end = rule(que)
      if (end) {
        return end
      }
    }
  }
}

/**
 * 最后一个可选为空
 * @param rules 
 * @returns 
 */
export function orMatchEmpty(...rules: ParseFun<any>[]) {
  return orMatch(...rules, quote)
}

export function matchStep1<Q extends BaseQue<any>>(
  step: (n: Q extends BaseQue<infer M> ? M : never) => boolean
): ParseFun<Q> {
  return function (que) {
    return que.step1(step) as Q | undefined
  }
}
export class CharRange {
  private constructor(
    public readonly a: number,
    public readonly b: number,
  ) {
    if (a >= b) {
      throw new Error(`结束${b}应该比开始${a}大`)
    }
  }
  static of(begin: number, end: number) {
    return new CharRange(begin, end)
  }
  matchCharBetween(...excludes: number[]) {
    const a = this.a, b = this.b
    const set = new Set(excludes)
    if (set.size != excludes.length) {
      console.warn("不包含里有重复项")
    }
    set.forEach(v => {
      if (v < a || v > b) {
        throw new Error(`排除项中${v}不在${a}与${b}之间`)
      }
    })
    return (que: Que) => {
      return que.step1Code(c => {
        if (c < a || c > b) {
          return false
        }
        if (set.has(c)) {
          return false
        }
        return true
      })
    }
  }
  matchCharNotBetween(...includes: number[]) {
    const a = this.a, b = this.b
    const set = new Set(includes)
    if (set.size != includes.length) {
      console.warn("不包含里有重复项")
    }
    set.forEach(v => {
      if (v >= a && v <= b) {
        throw new Error(`包含项中${v}不在${a}与${b}之间`)
      }
    })

    return (que: Que) => {
      return que.step1Code(c => {
        if (c < a || c > b) {
          if (!set.has(c)) {
            return true
          }
        }
        return false
      })
    }
  }
}

export function andMatch(...rules: ParseFun<any>[]) {
  return function <Q extends BaseQue<any>>(que: Q) {
    let last = que
    for (const rule of rules) {
      const nlast = rule(last)
      if (nlast) {
        last = nlast
      } else {
        return
      }
    }
    return last
  }
}


export function manyMatch(
  rule: ParseFun<any>,
  min = 0,
  between: ParseFun<any> = quote,
  first: ParseFun<any> = quote
) {
  function goLast<Q>(count: number, last: Q) {
    if (count < min) {
      return
    }
    return last
  }
  return function <Q extends BaseQue<any>>(que: Q) {
    let last = que
    let count = 0
    while (true) {
      if (count) {
        const alast = between(last)
        if (alast) {
          last = alast
        } else {
          return goLast(count, last)
        }
      } else {
        const alast = first(last)
        if (alast) {
          last = alast
        } else {
          return goLast(count, last)
        }
      }
      const blast = rule(last)
      if (blast) {
        count++
        last = blast
      } else {
        return goLast(count, last)
      }
    }
  }
}

export class ParseError extends Error {
  constructor(
    public readonly message: string
  ) {
    super(message)
  }
}

export function error(message: string) {
  return new ParseError(message)
}
////////////////////////////////////////////////////////////////////////////////////////////////**************//////////////////////////////////////////////////////////////////////
export class ParserSuccess<Q extends BaseQue<any>, T> {
  constructor(
    public readonly value: T,
    public readonly end: Q
  ) { }
}
export function success<Q extends BaseQue<any>, T>(v: T, que: Q) {
  return new ParserSuccess(v, que)
}

/**
 * 使用try...catch来抛出错误...
 */
export type ParseFunGet<Q extends BaseQue<any>, T> = (que: Q) => ParserSuccess<Q, T> | ParseError
export function isParseSuccess<T extends ParserSuccess<any, any>>(v: T | ParseError): v is T {
  return v instanceof ParserSuccess
}

type RuleCallback<Q extends BaseQue<any>, T> = (begin: Q, end: Q) => T
export function ruleGet<Q extends BaseQue<any>, T>(
  rule: ParseFun<Q>,
  callback: RuleCallback<Q, T>,
  failMsg = ''
): ParseFunGet<Q, T> {
  return function (que) {
    const end = rule(que)
    if (end) {
      try {
        return success(callback(que, end), end)
      } catch (err) {
        return error(err as string)
      }
    }
    if (que.allowLog) {
      console.log("ruleGet失败", failMsg)
    }
    return error(failMsg)
  }
}

export function ruleSkip<Q extends BaseQue<any>>(
  rule: ParseFun<Q>,
  failMsg = ''
) {
  return ruleGet(rule, emptyFun, failMsg)
}
export function andRuleGet<Q extends BaseQue<any>, T, T1, T2>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
  ],
  merge: (...vs: [T1, T2]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
  ],
  merge: (...vs: [T1, T2, T3]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
  ],
  merge: (...vs: [T1, T2, T3, T4]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4, T5>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
  ],
  merge: (...vs: [T1, T2, T3, T4, T5]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4, T5, T6>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
  ],
  merge: (...vs: [T1, T2, T3, T4, T5, T6]) => T,
  message?: string
): ParseFunGet<Q, T>

export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4, T5, T6, T7>(args: [
  ParseFunGet<Q, T1>,
  ParseFunGet<Q, T2>,
  ParseFunGet<Q, T3>,
  ParseFunGet<Q, T4>,
  ParseFunGet<Q, T5>,
  ParseFunGet<Q, T6>,
  ParseFunGet<Q, T7>
], merge: (...vs: [T1, T2, T3, T4, T5, T6, T7]) => T, message?: string): ParseFunGet<Q, T>;

export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4, T5, T6, T7, T8>(args: [
  ParseFunGet<Q, T1>,
  ParseFunGet<Q, T2>,
  ParseFunGet<Q, T3>,
  ParseFunGet<Q, T4>,
  ParseFunGet<Q, T5>,
  ParseFunGet<Q, T6>,
  ParseFunGet<Q, T7>,
  ParseFunGet<Q, T8>
], merge: (...vs: [T1, T2, T3, T4, T5, T6, T7, T8]) => T, message?: string): ParseFunGet<Q, T>;

export function andRuleGet<Q extends BaseQue<any>, T, T1, T2, T3, T4, T5, T6, T7, T8, T9>(args: [
  ParseFunGet<Q, T1>,
  ParseFunGet<Q, T2>,
  ParseFunGet<Q, T3>,
  ParseFunGet<Q, T4>,
  ParseFunGet<Q, T5>,
  ParseFunGet<Q, T6>,
  ParseFunGet<Q, T7>,
  ParseFunGet<Q, T8>,
  ParseFunGet<Q, T9>
], merge: (...vs: [T1, T2, T3, T4, T5, T6, T7, T8, T9]) => T, message?: string): ParseFunGet<Q, T>;

export function andRuleGet<Q extends BaseQue<any>, T>(
  args: ParseFunGet<Q, any>[],
  merge: (...vs: any) => T,
  message?: string
): ParseFunGet<Q, T> {
  return function (que) {
    const values: any[] = []
    for (const rg of args) {
      const end = rg(que)
      if (isParseSuccess(end)) {
        que = end.end
        values.push(end.value)
      } else {
        if (que.allowLog) {
          console.log("解析失败", message)
        }
        return end
      }
    }
    try {
      const out = merge.apply(null, values)
      return success(out, que)
    } catch (err) {
      return error(err as string)
    }
  }
}
export function orRuleGet<Q extends BaseQue<any>, T1, T2>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T5>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5, T6>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5, T6, T7>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5, T6, T7, T8>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>,
    ParseFunGet<Q, T8>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>,
    ParseFunGet<Q, T8>,
    ParseFunGet<Q, T9>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8 | T9>
export function orRuleGet<Q extends BaseQue<any>, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>,
    ParseFunGet<Q, T8>,
    ParseFunGet<Q, T9>,
    ParseFunGet<Q, T10>
  ],
  message?: string
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8 | T9 | T10>
export function orRuleGet<Q extends BaseQue<any>>(
  rules: ParseFunGet<Q, any>[],
  message?: string
): ParseFunGet<Q, any> {
  return function (que) {
    let last: ParseError = null as any
    for (const rule of rules) {
      const v = rule(que)
      if (isParseSuccess(v)) {
        return v
      }
      last = v
    }
    if (que.allowLog) {
      console.log("orRuleGet失败", message)
    }
    return last
  }
}
export function alawaysGet<Q extends BaseQue<any>, T>(callback: (que: Q) => T): ParseFunGet<Q, T>
export function alawaysGet<Q extends BaseQue<any>>(): ParseFunGet<Q, undefined>
export function alawaysGet() {
  const cb = arguments[0]
  return ruleGet(quote, function (que) {
    return cb?.(que)
  })
}
/**
 * 
 * @param rule 
 * @param min 
 * @param prefix:预判断 
 * @returns 
 */
export function manyRuleGet<Q extends BaseQue<any>, T>(
  rule: ParseFunGet<Q, T>,
  min = 0,
  between: ParseFun<any> = quote,
  first: ParseFun<any> = quote
): ParseFunGet<Q, T[]> {
  function goLast(vs: T[], last: Q) {
    if (vs.length < min) {
      return error(`need at min ${min} but get ${vs.length}`)
    }
    return success(vs, last)
  }
  return function (que) {
    const vs: T[] = []
    let last = que
    let idx = 0
    while (true) {
      if (idx) {
        const alast = between(last)
        if (alast) {
          last = alast
        } else {
          return goLast(vs, last)
        }
      } else {
        const alast = first(last)
        if (alast) {
          last = alast
        } else {
          return goLast(vs, last)
        }
      }
      const blast = rule(last)
      if (isParseSuccess(blast)) {
        idx++
        last = blast.end
        vs.push(blast.value)
      } else {
        return goLast(vs, last)
      }
    }
  }
}

/**
 * 
 * @param firstRule 
 * @param restRule
 * @param reduce 从左到右叠加
 */
export function reduceRuleGet<Q extends BaseQue<any>, T, F>(
  firstRule: ParseFunGet<Q, T>,
  restRule: ParseFunGet<Q, F>,
  reduce: (init: T, rest: F) => T | void | undefined | null
): ParseFunGet<Q, T> {
  return function (que) {
    let last = que
    const rest = firstRule(last)
    if (isParseSuccess(rest)) {
      last = rest.end
      let init = rest.value
      while (true) {
        const nLast = restRule(last)
        if (isParseSuccess(nLast)) {
          const out = reduce(init, nLast.value)
          if (out) {
            last = nLast.end
            init = out
          } else {
            return success(init, last)
          }
        } else {
          return success(init, last)
        }
      }
    }
    return rest
  }
}

export function ruleGetTranslate<A extends BaseQue<any>, T, F>(
  parseFunGet: ParseFunGet<A, T>,
  translate: (t: T) => F
): ParseFunGet<A, F> {
  return function (que) {
    const out = parseFunGet(que)
    if (isParseSuccess(out)) {
      try {
        const v = translate(out.value)
        return success(v, out.end)
      } catch (err) {
        return error(err as string)
      }
    }
    return out
  }
}

export const ruleGetString: RuleCallback<Que, string> = function (begin, end) {
  return begin.content.slice(begin.i, end.i)
}

export const whiteList = ' \r\n\t'.split('')
const whiteSpaceMatch = orMatch(
  ...whiteList.map(v => matchAnyString(v))
)
export const whiteSpaceRule = manyMatch(
  whiteSpaceMatch,
  1
)

export const whiteSpaceRuleZero = manyMatch(
  whiteSpaceMatch
)


export function arraySplitInto<T>(vs: T[], fun: (v: T) => any) {
  let lastSplit: T | undefined = undefined
  let lastIdx = 0
  const list: [T | undefined, T[]][] = []
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i]
    if (fun(v)) {
      const before = vs.slice(lastIdx, i)
      lastIdx = i + 1
      lastSplit = v
      list.push([lastSplit, before])
    }
  }
  const last = vs.slice(lastIdx)
  list.push([lastSplit, last])
  return {
    first: list[0][1],
    rest: list.slice(1) as [T, T[]][]
  }
}
export function arraySplit<T>(vs: T[], fun: (v: T) => any) {
  let lastIdx = 0
  const list: T[][] = []
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i]
    if (fun(v)) {
      const before = vs.slice(lastIdx, i)
      lastIdx = i + 1
      list.push(before)
    }
  }
  const last = vs.slice(lastIdx)
  list.push(last)
  return list
}