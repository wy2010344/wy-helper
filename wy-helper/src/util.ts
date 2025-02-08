import { GetValue } from "./setStateHelper";


export type NullType = undefined | null | void;
/**6种情况为false,NaN是数字类型*/
export type FalseType = false | 0 | 0n | "" | NullType
export type EmptyFun = (...vs: any[]) => void
export type Quote<T> = (v: T, ...vs: any[]) => T
export function quote<T>(v: T, ...vs: any[]) { return v }
export function run<T extends AnyFunction>(
  fun: T
): ReturnType<T> {
  return fun()
}

class FreezeError extends Error {
}

const FreezeErrorSymbol = Symbol('FreezeErrorSymbol')
export const objectFreeze = 'freeze' in Object ? Object.freeze.bind(Object) : quote
export const objectFreezeThrow = run((): <T extends Object>(v: T) => T => {
  if (globalThis.Proxy) {
    return (a: any) => {
      return new Proxy(a, {
        get(target, p, receiver) {
          if (p == FreezeErrorSymbol) {
            //特殊的区分符号
            return true
          }
          return target[p]
        },
        set(target, p, newValue, receiver) {
          throw new FreezeError("don't allow set value")
        },
      })
    }
  }
  return objectFreeze
})
// 检查对象是否是代理对象
function isProxy(obj: any) {
  return obj && obj[FreezeErrorSymbol]
};
export function objectDeepFreezeThrow<T>(n: T, before: any[] = []) {
  if (typeof n == 'object' && n) {
    if (isProxy(n) || Object.isFrozen(n)) {
      return n
    }
    if (before.includes(n)) {
      return n
    }
    try {
      const newBefore = before.concat(n)
      if (Array.isArray(n)) {
        for (let i = 0; i < n.length; i++) {
          n[i] = objectDeepFreezeThrow(n[i], newBefore)
        }
      } else {
        for (const key in n) {
          n[key] = objectDeepFreezeThrow(n[key], newBefore)
        }
      }
      return objectFreezeThrow(n)
    } catch (err) {
      if (err instanceof FreezeError) {
        //忽略
      } else {
        //都忽略,比如动态import回来的模块,无法冻结
        console.error('freeeze fail', err)
        // throw err
      }
    }
  }
  return n
}



export const emptyArray = objectFreezeThrow([]) as readonly any[]
export function getTheEmptyArray<T>() {
  return emptyArray as T[]
}
export function createEmptyArray<T>() {
  return [] as T[]
}
export const emptyObject = objectFreezeThrow({})

export function createEmptyObject<T>() {
  return {} as T
}
export function getTheEmptyObject<T>() {
  return emptyObject as T
}
export function emptyFun(...vs: any[]) { }

export function quoteOrLazyGet<T>(v: T | (() => T), ...vs: any[]): T {
  if (typeof v == 'function') {
    return (v as any)()
  } else {
    return v
  }
}
export type AnyFunction = (...vs: any[]) => any
export async function quotePromise<T>(v: T, ...vs: any[]) { return v }
export function expandFunCall<T extends AnyFunction>(
  fun: T
) {
  fun()
}
export interface ManageValue<T> {
  add(v: T): void
  remove(v: T): void
}


export function iterableToList<T>(entity: IterableIterator<T>) {
  const list: T[] = []
  while (true) {
    const value = entity.next()
    if (value.done) {
      break
    }
    list.push(value.value)
  }
  return list
}


export function alawaysTrue() {
  return true
}
export function alawaysFalse() {
  return false
}
export function defaultToGetTrue(value: any) {
  if (value) {
    if (typeof value == 'function') {
      return value
    }
    return alawaysTrue
  }
  return undefined
}

export function getCacheCreateMap<K, V>(createV: (key: K) => V) {
  const map = new Map<K, V>()
  return function (key: K) {
    let value = map.get(key)
    if (value) {
      return value
    }
    value = createV(key)
    map.set(key, value)
    return value
  }
}


export function delay(n: number) {
  return new Promise(resolve => {
    setTimeout(resolve, n)
  })
}


export function getTimeoutPromise(time: number, then = emptyFun) {
  return function () {
    return delay(time).then(then)
  }
}

export const supportMicrotask = !!globalThis.queueMicrotask
export const supportMessageChannel = typeof MessageChannel !== 'undefined'


export function messageChannelCallback(callback: EmptyFun) {
  if (supportMessageChannel) {
    const { port1, port2 } = new MessageChannel()
    if ('on' in port1) {
      port1.on("message", callback)
    } else {
      (port1 as any).onmessage = callback
    }
    return port2.postMessage(null)
  } else {
    setTimeout(callback)
  }
}

export function asLazy<T>(v: T) {
  return function () {
    return v
  }
}


export function cacheGet<T>(fun: () => T) {
  let value: { v: T } | undefined = undefined
  return function () {
    if (!value) {
      value = { v: fun() }
    }
    return value.v
  }
}





export function setToAdd<V>(set: Set<V>, ...vs: V[]) {
  const aSet = new Set(set)
  for (const v of vs) {
    aSet.add(v)
  }
  return aSet
}


export type ReadArray<T> = {
  length: number;
  [index: number]: T;
};


export function readArrayMap<T, V>(vs: ReadArray<T>, fun: (v: T, i: number) => V) {
  const ls: V[] = []
  for (let i = 0; i < vs.length; i++) {
    ls.push(fun(vs[i], i))
  }
  return ls
}

export function readArraySlice<T>(
  list: ReadArray<T>,
  from: number = 0,
  to: number = list.length,
  out: T[] = []
) {
  for (let i = from; i < to; i++) {
    out.push(list[i])
  }
  return out
}

export function readArraySliceCircle<T>(list: ReadArray<T>, from: number = 0, end: number = list.length) {
  if (from > end) {
    throw new Error("from 必须小于 end")
  }
  const n = list.length
  if (end - from > n) {
    throw new Error("必须在列表的长度区间!")
  }
  if (from < 0) {
    from = getAbsoulteIndex(n, from)
    if (end < 0) {
      return readArraySlice(list, from, getAbsoulteIndex(n, end))
    }
    const out: T[] = []
    readArraySlice(list, from, n, out)
    readArraySlice(list, 0, end, out)
    return out
  } else if (end >= n) {
    end = getAbsoulteIndex(n, end)
    if (from >= n) {
      return readArraySlice(list, getAbsoulteIndex(n, from), end)
    }
    const out: T[] = []
    readArraySlice(list, from, n, out)
    readArraySlice(list, 0, end, out)
    return out
  }
  return readArraySlice(list, from, end)
}

export function getAbsoulteIndex(n: number, i: number) {
  const at = i % n
  if (at < 0) {
    return at + n
  }
  return at
}

export class WrapperValue<T> {
  constructor(public readonly value: T) { }
}


export type DelayCall = (
  notify: EmptyFun
) => EmptyFun


export function timeoutDelayCall(time: number): DelayCall {
  return function (notify) {
    const inv = setTimeout(notify, time)
    return function () {
      clearTimeout(inv)
    }
  }
}

export function subscribeTimeout(callback: EmptyFun, time: number) {
  /**
   * 需要取消订阅,因为开发者模式useEffect执行多次,不取消会造成问题
   */
  const inv = setTimeout(callback, time)
  return function () {
    clearTimeout(inv)
  }
}
export function numberIntFillWithN0(n: number, x: number) {
  const nx = n + ''

  let intLen = nx.indexOf('.')
  if (intLen < 0) {
    intLen = nx.length
  }
  const diff = x - intLen
  if (diff > 0) {
    return '0'.repeat(diff) + nx
  }
  return nx
}

/**
 * 删除小数点后的0
 * @param nx 
 * @returns 
 */
export function removeLastZero(nx: string) {
  if (nx.includes('.')) {
    let i = nx.length - 1;
    while (nx[i] == "0") {
      i--;
    }
    if (nx[i] == ".") {
      i--;
    }
    return nx.slice(0, i + 1);
  }
  return nx
}
/**
 * 保留fix位小数,如果后面为0,去掉
 * @param n
 * @param fix
 * @returns
 */
export function numberFixRemoveZero(n: number, fix: number) {
  if (fix > 0) {
    const nx = n.toFixed(fix);
    return removeLastZero(nx);
  }
  return n + "";
}


export function mathAdd(a: number, b: number) {
  return a + b
}

export function mathSub(a: number, b: number) {
  return a / b
}

export function mathMul(a: number, b: number) {
  return a * b
}

export function mathDiv(a: number, b: number) {
  return a / b
}


export function trueAndS(a: any, left: string, right = '') {
  return a ? left : right
}


export function numberSortAsc(a: number, b: number) {
  return a - b
}
export function numberSortDesc(a: number, b: number) {
  return b - a
}
/**
 * ({ x: "ax" } | { x: "cc" }) & { y: 99 };
 * 转化成
 * { x: "ax"; y: 99 } | { x: "cc"; y: 99 };
 */
export type Flatten<T> = T extends T ? { [K in keyof T]: T[K] } : never;






export function genTemplateStringS1(ts: TemplateStringsArray, vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}



export type VType = string | number | GetValue<number | string>
export function vTypeisGetValue(v: VType): v is GetValue<number | string> {
  return typeof v == 'function'
}

function toSingleValue(v: VType) {
  if (typeof v == 'function') {
    return v()
  }
  return v
}

export function genTemplateStringS2(
  ts: TemplateStringsArray,
  vs: VType[]
) {
  return genTemplateStringS1(ts, vs.map(toSingleValue))
}


export function tw(strings: TemplateStringsArray, ...vs: string[]) {
  return genTemplateStringS1(strings, vs)
}