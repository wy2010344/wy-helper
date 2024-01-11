
export type ReadArray<T> = {
  length: number;
  [index: number]: T;
};
export type QueArray<T> = ReadArray<T> & {
  slice(begin?: number, end?: number): QueArray<T>
}

type Match<V> = (v: V) => boolean
export class BaseQue<V, VS extends QueArray<V>> {
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
    return new BaseQue<V, VS>(this.content, step)
  }
  toString() {
    return JSON.stringify(this)
  }
}

export class Que extends BaseQue<string, string>{
  match(vs: string[]) {
    for (const v of vs) {
      if (this.content.startsWith(v, this.i)) {
        return this.stepQue(this.i + v.length)
      }
    }
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
 */
export type ParseFun<Q extends BaseQue<any, any>> = (que: Q) => (Q | void)
export function matchVS<V, VS extends QueArray<V>>(...vs: Match<V>[]): ParseFun<BaseQue<V, VS>> {
  return function (que) {
    for (const v of vs) {
      const next = que.step1(v)
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

export function matchBetween<Q extends Que>(begin: number, end: number): ParseFun<Q> {
  return function (que) {
    return que.step1Code(v => begin <= v && v <= end) as Q | undefined
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

export function manyMatch(rule: ParseFun<any>, min = 0) {
  return function <Q extends BaseQue<any, any>>(que: Q) {
    let last = que
    let count = 0
    while (true) {
      const nlast = rule(last)
      if (nlast) {
        count++
        last = nlast
      } else {
        if (count < min) {
          return
        }
        return last
      }
    }
  }
}

export class ParserSuccess<Q extends BaseQue<any, any>, T>{
  constructor(
    public readonly value: T,
    public readonly end: Q
  ) { }
}
function success<Q extends BaseQue<any, any>, T>(v: T, que: Q) {
  return new ParserSuccess(v, que)
}


export type ParseFunGet<Q extends BaseQue<any, any>, T> = (que: Q) => (ParserSuccess<Q, T> | void)


type RuleCallback<Q extends BaseQue<any, any>, T> = (begin: Q, end: Q) => T
export function ruleGet<Q extends BaseQue<any, any>, T>(
  rule: ParseFun<Q>,
  callback: RuleCallback<Q, T>
): ParseFunGet<Q, T> {
  return function (que) {
    const end = rule(que)
    if (end) {
      return success(callback(que, end), end)
    }
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
  merge: (...vs: [T1, T2]) => T
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any, any>, T, T1, T2, T3>(
  args: [
    ParseFunGet<Q, T1>,
    ParseFunGet<Q, T2>,
    ParseFunGet<Q, T3>,
  ],
  merge: (...vs: [T1, T2, T3]) => T
): ParseFunGet<Q, T>
export function andRuleGet<Q extends BaseQue<any, any>, T>(
  args: ParseFunGet<Q, any>[],
  merge: (...vs: any) => T
): ParseFunGet<Q, T> {
  return function (que) {
    const values: any[] = []
    for (const rg of args) {
      const end = rg(que)
      if (end) {
        que = end.end
        values.push(end.value)
      } else {
        return
      }
    }
    return success(merge.apply(null, values), que)
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
export function orRuleGet<Q extends BaseQue<any, any>>(...rules: ParseFunGet<Q, any>[]): ParseFunGet<Q, any> {
  return function (que) {
    for (const rule of rules) {
      const v = rule(que)
      if (v) {
        return v
      }
    }
  }
}

export function manyRuleGet<Q extends BaseQue<any, any>, T>(rule: ParseFunGet<Q, T>, min = 0): ParseFunGet<Q, T[]> {
  return function (que) {
    const vs: T[] = []
    let last = que
    while (true) {
      const nlast = rule(last)
      if (nlast) {
        last = nlast.end
        vs.push(nlast.value)
      } else {
        if (vs.length < min) {
          return
        }
        return success(vs, last)
      }
    }
  }
}


export const ruleGetString: RuleCallback<Que, string> = function (begin, end) {
  return begin.content.slice(begin.i, end.i)
}


export const whiteList = ' \r\n\t'.split('')

export const whiteSpaceRule = manyMatch(
  orMatch(
    ...whiteList.map(v => match(v))
  ),
  1
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
  let lastSplit: T | undefined = undefined
  let lastIdx = 0
  const list: T[][] = []
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i]
    if (fun(v)) {
      const before = vs.slice(lastIdx, i)
      lastIdx = i + 1
      lastSplit = v
      list.push(before)
    }
  }
  const last = vs.slice(lastIdx)
  list.push(last)
  return list
}