import { emptyFun } from '../util';
import { ParseFun, BaseQue, error, Que } from './tokenParser';
export function parseSkip<Q extends BaseQue<any>>(
  fun: ParseFun<Q>,
  message = ''
) {
  parseGet(fun, emptyFun, message);
}
export function parseGet<Q extends BaseQue<any>, T>(
  fun: ParseFun<Q>,
  callback: (begin: Q, end: Q) => T,
  message = ''
) {
  const lastQue = currentQue as Q;
  const end = fun(lastQue);
  if (end) {
    currentQue = end;
    return callback(lastQue, end);
  } else {
    throw error(message);
  }
}

export function parseTop<Fun extends (...vs: any[]) => any>(
  fun: Fun,
  message = ''
) {
  return (...vs: Parameters<Fun>): ReturnType<Fun> => {
    try {
      return fun(...vs);
    } catch (err) {
      if (currentQue!.allowLog) {
        console.log(message);
      }
      throw err;
    }
  };
}

let currentQue: BaseQue<any> | undefined = undefined;
export function runParse<T>(value: string, fun: () => T, debug?: boolean) {
  const oldQue = currentQue;
  try {
    currentQue = new Que(value, 0);
    if (debug) {
      currentQue.allowLog = true;
    }
    return fun();
  } finally {
    currentQue = oldQue;
  }
}
export function getCurrentQue() {
  return currentQue;
}

export function or<T1, T2>(vs: [() => T1, () => T2], message?: string): T1 | T2;
export function or<T1, T2, T3>(
  vs: [() => T1, () => T2, () => T3],
  message?: string
): T1 | T2 | T3;
export function or<T1, T2, T3, T4>(
  vs: [() => T1, () => T2, () => T3, () => T4],
  message?: string
): T1 | T2 | T3 | T4;
export function or<T1, T2, T3, T4, T5>(
  vs: [() => T1, () => T2, () => T3, () => T4, () => T5],
  message?: string
): T1 | T2 | T3 | T4 | T5;
export function or<T1, T2, T3, T4, T5, T6>(
  vs: [() => T1, () => T2, () => T3, () => T4, () => T5, () => T6],
  message?: string
): T1 | T2 | T3 | T4 | T5 | T6;
export function or<T1, T2, T3, T4, T5, T6, T7>(
  vs: [() => T1, () => T2, () => T3, () => T4, () => T5, () => T6, () => T7],
  message?: string
): T1 | T2 | T3 | T4 | T5 | T6 | T7;
export function or<T1, T2, T3, T4, T5, T6, T7, T8>(
  vs: [
    () => T1,
    () => T2,
    () => T3,
    () => T4,
    () => T5,
    () => T6,
    () => T7,
    () => T8,
  ],
  message?: string
): T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8;
export function or<T>(vs: (() => T)[], message?: string): T;
export function or(vs: (() => any)[], message = '') {
  const keepQue = currentQue!;
  for (const v of vs) {
    try {
      return v();
    } catch (err) {
      //忽略并回滚
      currentQue = keepQue;
    }
  }
  if (keepQue.allowLog) {
    console.log(message);
  }
  throw error(message);
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
