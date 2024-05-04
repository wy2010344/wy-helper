import { emptyFun } from '../util'
import { ParseFun, BaseQue, error, Que, matchCharIn, matchAnyString, matchCharNotIn, ParseFunGet, ParserSuccess, success } from './tokenParser'
export function parseSkip<Q extends BaseQue<any>>(
  fun: ParseFun<Q>,
  message = ''
) {
  parseGet(fun, emptyFun, message)
}
export function parseGet<Q extends BaseQue<any>, T>(
  fun: ParseFun<Q>,
  callback: (begin: Q, end: Q) => T,
  message = ''
) {
  const lastQue = stacks[0] as Q
  const end = fun(lastQue)
  if (end) {
    stacks.unshift(end)
    return callback(lastQue, end)
  } else {
    throw error(message)
  }
}
const stacks: BaseQue<any>[] = []
export function runParse<T>(value: string, fun: () => T) {
  try {
    stacks.unshift(new Que(value, 0))
    return fun()
  } finally {
    stacks.length = 0
  }
}


export function or<T1, T2>(
  vs: [
    () => T1,
    () => T2
  ],
  message?: string
): T1 | T2
export function or<T1, T2, T3>(
  vs: [
    () => T1,
    () => T2,
    () => T3
  ],
  message?: string
): T1 | T2 | T3
export function or<T1, T2, T3, T4>(
  vs: [
    () => T1,
    () => T2,
    () => T3,
    () => T4
  ],
  message?: string
): T1 | T2 | T3 | T4
export function or<T1, T2, T3, T4, T5>(
  vs: [
    () => T1,
    () => T2,
    () => T3,
    () => T4,
    () => T5
  ],
  message?: string
): T1 | T2 | T3 | T4 | T5
export function or<T1, T2, T3, T4, T5, T6>(
  vs: [
    () => T1,
    () => T2,
    () => T3,
    () => T4,
    () => T5,
    () => T6
  ],
  message?: string
): T1 | T2 | T3 | T4 | T5 | T6
export function or(
  vs: (() => any)[],
  message = ''
) {
  const length = stacks.length
  for (const v of vs) {
    try {
      return v()
    } catch (err) {
      //忽略并回滚
      stacks.length = length
    }
  }
  throw error(message)
}





export function ruleStrBetweenGet1(
  begin: number,
  end: number = begin
) {
  parseSkip(matchCharIn(begin))
  const endChar = String.fromCharCode(end)
  const list: string[] = []
  while (true) {
    const value = or([
      () => {
        return parseGet(matchAnyString('\\\\'), () => '\\')
      },
      () => {
        return parseGet(matchAnyString(`\\${endChar}`), () => endChar)
      },
      () => {
        return parseGet(matchCharNotIn(end), begin => begin.current())
      },
      emptyFun
    ])
    if (value) {
      list.push(value)
    } else {
      break
    }
  }
  parseSkip(matchCharIn(end))
  return list.join('')
}

// Generator并不是很好标注类型
// type ParseGet<Q extends BaseQue<any>, T> = (que: Q) => ParserSuccess<Q, T>

// type GA<Q extends BaseQue<any>, M> = Generator<ParseGet<Q, M>, M, M>
// const abc = function*<Q extends BaseQue<any>>(): GA<Q, any> {
//   const a = yield que => {
//     return success(98, que)
//   }

//   return ""
// }