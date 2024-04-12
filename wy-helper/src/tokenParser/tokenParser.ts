import { ReadArray, quote } from "../util";

export type QueArray<T> = ReadArray<T> & {
  slice(begin?: number, end?: number): QueArray<T>
}

export type Match<V> = (v: V) => boolean

export type BaseQue<V, VS extends QueArray<V>> = {
  readonly i: number
  readonly content: VS
  step1(callback: Match<V>): BaseQue<V, VS> | void
}
export class BQue<V, VS extends QueArray<V>> implements BaseQue<V, VS> {
  constructor(
    public readonly content: VS,
    //下标
    public readonly i = 0,
  ) { }
  step1(callback: Match<V>) {
    if (this.i < this.content.length) {
      if (callback(this.content[this.i])) {
        return this.stepQue(this.i + 1)
      }
    }
  }
  protected stepQue(step: number) {
    return new BQue<V, VS>(this.content, step)
  }
  toString() {
    return JSON.stringify(this)
  }
}

export class Que extends BQue<string, string> {
  match(vs: string[]) {
    for (const v of vs) {
      if (this.content.startsWith(v, this.i)) {
        return this.stepQue(this.i + v.length)
      }
    }
  }

  /**
   * 匹配到这些字眼,提前进入结束
   * @param vs 
   * @returns 
   */
  matchToEnd(vs: string[]) {
    if (this.i == this.content.length) {
      return this
    }
    for (const v of vs) {
      if (this.content.startsWith(v, this.i)) {
        return void 0;
      }
    }
    return this
  }

  protected stepQue(step: number): Que {
    return new Que(this.content, step)
  }
  step1Code(callback: (v: number) => boolean) {
    return this.step1(function (v) {
      return callback(v.charCodeAt(0))
    })
  }
}
export class LineCharQue extends Que {
  constructor(
    content: string, i: number = 0,
    //行号,从0开始
    public readonly line = 0,
    //列号,从0开始
    public readonly character = 0
  ) {
    super(content, i)
  }

  protected stepQue(step: number) {
    let line = this.line
    let character = this.character
    for (let x = this.i; x < step; x++) {
      if (this.content[x] == '\n') {
        ++line
        character = 0
      } else {
        ++character
      }
    }
    return new LineCharQue(this.content, step, line, character)
  }
}
/**
 * 解析,如果解析成功,返回正数.解析失败,返回负数
 * 这里不处理错误.
 */
export type ParseFun<Q extends BaseQue<any, any>> = (que: Q) => (Q | void)
export function matchVS<V, F extends BaseQue<V, any>>(...vs: Match<V>[]): ParseFun<F> {
  return function (que) {
    for (const v of vs) {
      const next = que.step1(v) as F
      if (next) {
        que = next
      } else {
        return
      }
    }
    return que
  }
}
export function match<Q extends Que>(...vs: string[]): ParseFun<Q> {
  return function (que) {
    return que.match(vs) as Q | undefined
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

export function matchEnd<Q extends BaseQue<any, any>>(que: Q) {
  return que.i == que.content.length ? que : undefined
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

export function notMathChar<Q extends Que>(...charCodes: number[]): ParseFun<Q> {
  return function (que) {
    return que.step1Code(code => !charCodes.includes(code)) as Q | undefined
  }
}

export function matchStep<Q extends Que>(step: (n: number) => boolean): ParseFun<Q> {
  return function (que) {
    return que.step1Code(step) as Q | undefined
  }
}
export class CharRange {
  private constructor(
    public readonly begin: number,
    public readonly end: number,
    public readonly excludes: number[]
  ) {
    if (begin > end) {
      throw new Error(`begin:${begin} > end${end} `)
    }
    for (let i = 0; i < excludes.length; i++) {
      const exclude = excludes[i]
      if (exclude < begin || end < exclude) {
        throw new Error(`exclude:${exclude} not in [${begin},${end}]`)
      }
    }
  }
  static of(begin: number, end: number, ...excludes: number[]) {
    return new CharRange(begin, end, excludes)
  }

  replaceExcludes(...excludes: number[]) {
    return new CharRange(this.begin, this.end, excludes)
  }


  private matchBetween: any = undefined
  getMatchBetween<Q extends Que>() {
    if (!this.matchBetween) {
      const that = this
      this.matchBetween = function (que: Q) {
        return que.step1Code(v => {
          if (that.excludes.includes(v)) {
            return false
          }
          return that.begin <= v && v <= that.end
        }) as Q | undefined
      }
    }
    return this.matchBetween as unknown as ParseFun<Q>
  }

  private notMatchBetween: any = undefined
  getNotMatchBetween<Q extends Que>() {
    if (!this.notMatchBetween) {
      const that = this
      this.notMatchBetween = function (que: Q) {
        return que.step1Code(v => {
          if (that.excludes.includes(v)) {
            return true
          }
          return !(that.begin <= v && v <= that.end)
        }) as Q | undefined
      }
    }
    return this.notMatchBetween as unknown as ParseFun<Q>
  }
}



export function andMatch(...rules: ParseFun<any>[]) {
  return function <Q extends BaseQue<any, any>>(que: Q) {
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
  return function <Q extends BaseQue<any, any>>(que: Q) {
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

export class ParserSuccess<Q extends BaseQue<any, any>, T> {
  constructor(
    public readonly value: T,
    public readonly end: Q
  ) { }
}
export class ParseError {
  constructor(
    public readonly message: string
  ) { }
}
function success<Q extends BaseQue<any, any>, T>(v: T, que: Q) {
  return new ParserSuccess(v, que)
}

/**
 * 使用try...catch来抛出错误...
 */
export type ParseFunGet<Q extends BaseQue<any, any>, T> = (que: Q) => ParserSuccess<Q, T> | ParseError
export function isParseSuccess<T extends ParserSuccess<any, any>>(v: T | ParseError): v is T {
  return v instanceof ParserSuccess
}

type RuleCallback<Q extends BaseQue<any, any>, T> = (begin: Q, end: Q) => T
export function ruleGet<Q extends BaseQue<any, any>, T>(
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
        return new ParseError(err as string)
      }
    }
    return new ParseError(failMsg)
  }
}



export function ruleGetSelf<V>(fun: Match<V>) {
  return ruleGet(matchVS(fun), function (begin, end) {
    return begin.content.slice(begin.i, end.i)[0]
  })
}
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
  ],
  merge: (...vs: [T1, T2]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2, T3>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
  ],
  merge: (...vs: [T1, T2, T3]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2, T3, T4>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
  ],
  merge: (...vs: [T1, T2, T3, T4]) => T,
  message?: string
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2, T3, T4, T5>(
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
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2, T3, T4, T5, T6>(
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
export function andRuleGet<Q extends BaseQue<any, any>, T>(
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
        console.log("解析失败", message)
        return end
      }
    }
    try {
      const out = merge.apply(null, values)
      return success(out, que)
    } catch (err) {
      return new ParseError(err as string)
    }
  }
}
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>
  ]
): ParseFunGet<Q, T1 | T2>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>
  ]
): ParseFunGet<Q, T1 | T2 | T3>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T5>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5, T6>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5, T6, T7>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5, T6, T7, T8>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>,
    ParseFunGet<Q, T8>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  ...rules: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
    ParseFunGet<Q, T4>,
    ParseFunGet<Q, T5>,
    ParseFunGet<Q, T6>,
    ParseFunGet<Q, T7>,
    ParseFunGet<Q, T8>,
    ParseFunGet<Q, T9>
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8 | T9>
export function orRuleGet<Q extends BaseQue<any, any>, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  ...rules: [
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
  ]
): ParseFunGet<Q, T1 | T2 | T3 | T4 | T6 | T7 | T8 | T9 | T10>
export function orRuleGet<Q extends BaseQue<any, any>>(...rules: ParseFunGet<Q, any>[]): ParseFunGet<Q, any> {
  return function (que) {
    let last: ParseError = null as any
    for (const rule of rules) {
      const v = rule(que)
      if (isParseSuccess(v)) {
        return v
      }
      last = v
    }
    return last
  }
}
export function alawaysGet<Q extends BaseQue<any, any>, T>(callback: (que: Q) => T): ParseFunGet<Q, T>
export function alawaysGet<Q extends BaseQue<any, any>>(): ParseFunGet<Q, undefined>
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
export function manyRuleGet<Q extends BaseQue<any, any>, T>(
  rule: ParseFunGet<Q, T>,
  min = 0,
  between: ParseFun<any> = quote,
  first: ParseFun<any> = quote
): ParseFunGet<Q, T[]> {
  function goLast(vs: T[], last: Q) {
    if (vs.length < min) {
      return new ParseError(`need at min ${min} but get ${vs.length}`)
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
export function reduceRuleGet<Q extends BaseQue<any, any>, T, F>(
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

export function ruleGetTranslate<A extends BaseQue<any, any>, T, F>(
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
        return new ParseError(err as string)
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
  ...whiteList.map(v => match(v))
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