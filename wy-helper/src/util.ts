
/**6种情况为false,NaN是数字类型*/
export type FalseType = false | undefined | null | 0 | "" | void
export type EmptyFun = (...vs: any[]) => void
export function quote<T>(v: T, ...vs: any[]) { return v }
export const objectFreeze = 'freeze' in Object ? Object.freeze.bind(Object) : quote

export const emptyArray = objectFreeze([]) as readonly any[]
export function getTheEmptyArray<T>() {
  return emptyArray as T[]
}
export function createEmptyArray<T>() {
  return [] as T[]
}
export const emptyObject = objectFreeze({})
export function emptyFun(...vs: any[]) { }

export type AnyFunction = (...vs: any[]) => any
export async function quotePromise<T>(v: T, ...vs: any[]) { return v }
export function expandFunCall<T extends AnyFunction>(
  fun: T
) {
  fun()
}
export function run<T extends AnyFunction>(
  fun: T
) {
  return fun()
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


export function lazyGet<T>(fun: () => T) {
  let value: T | undefined = undefined
  return function () {
    if (!value) {
      value = fun()
    }
    return value
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
  if (from < 0) {
    from = list.length + from
    if (end < 0) {
      return readArraySlice(list, from, end + list.length)
    }
    const out: T[] = []
    readArraySlice(list, from, list.length, out)
    readArraySlice(list, 0, end, out)
    return out
  } else if (end >= list.length) {
    end = end - list.length
    if (from >= list.length) {
      return readArraySlice(list, from - list.length, end)
    }
    const out: T[] = []
    readArraySlice(list, from, list.length, out)
    readArraySlice(list, 0, end, out)
    return out
  }
  return readArraySlice(list, from, end)
}



export class WrapperValue<T>{
  constructor(public readonly value: T) { }
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