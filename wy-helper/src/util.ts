
/**6种情况为false,NaN是数字类型*/
export type FalseType = false | undefined | null | 0 | ""
export type EmptyFun = (...vs: any[]) => void


export const emptyArray = [] as readonly any[]
export function getTheEmptyArray<T>() {
  return emptyArray as T[]
}
export function createEmptyArray<T>() {
  return [] as T[]
}
export const emptyObject = {}
export function emptyFun(...vs: any[]) { }

export type AnyFunction = (...vs: any[]) => any
export function quote<T>(v: T, ...vs: any[]) { return v }
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
