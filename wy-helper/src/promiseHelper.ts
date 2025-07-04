import { splitList } from "./ArrayHelper"
import { getOutResolvePromise, SetValue } from "./setStateHelper"
import { emptyArray, EmptyFun, emptyObject, messageChannelCallback } from "./util"



/**
 * 如果正在请求,则加入这个队列
 * 下次当然重新请求
 * @param callback 
 * @returns 
 */
export function batchGetPromise<T>(callback: () => Promise<T>) {
  let on = false
  const cacheList: {
    resolve(v: T): void
    reject(v?: any): void
  }[] = []
  function createPromise() {
    return new Promise<T>(function (resolve, reject) {
      cacheList.push({
        resolve,
        reject
      })
    })
  }
  return function () {
    if (on) {
      return createPromise()
    } else {
      on = true
      const promise = createPromise()
      callback().then(value => {
        cacheList.forEach(cache => {
          cache.resolve(value)
        })
        cacheList.length = 0
        on = false
      }).catch(err => {
        cacheList.forEach(cache => {
          cache.reject(err)
        })
        cacheList.length = 0
        on = false
      })
      return promise
    }
  }
}

export function shadowObject<T>(
  get: () => Promise<T>,
  save: (v: T) => Promise<any>
) {
  let value: T
  const batchGet = batchGetPromise(get)
  async function cacheGet() {
    if (value) {
      return value
    }
    const v = await batchGet()
    value = v
    return v
  }
  return [
    cacheGet,
    async function (v: T) {
      await cacheGet()
      value = v
      return save(v)
    }
  ] as const
}


export interface PromiseCB<T> {
  (err: null, value: T): void
  (err: any, value?: null): void
}
export function wrapPromise<T>(cb: PromiseCB<T> | null | undefined, promise: Promise<T>,) {
  if (cb) {
    promise.then(value => {
      cb?.(null, value)
    })
    promise.catch(err => {
      cb?.(err)
    })
  }
  return promise
}

export function wrapPromiseFun<T>(cb: PromiseCB<T> | null | undefined, fun: () => Promise<T>,) {
  return wrapPromise(cb, fun())
}


export async function mapPromiseAll<K extends string, V>(map: {
  [key in K]: Promise<V>
}) {
  const keys: string[] = []
  const promiseList: Promise<any>[] = []
  for (const key in map) {
    keys.push(key)
    promiseList.push(map[key])
  }
  const list = await Promise.all(promiseList)
  const out: { [key: string]: V } = {}
  for (let i = 0; i < keys.length; i++) {
    out[keys[i]] = list[i]
  }
  return out as {
    [key in K]: V
  }
}


export function createBuilkSet<K extends string | number, T>(
  save: (map: Map<K, T>) => void,
  {
    nextTime = messageChannelCallback,
  }: {
    nextTime?: SetValue<EmptyFun>
  } = emptyObject
) {
  let map = new Map<K, T>()
  return function (key: K, value: T) {
    if (!map.size) {
      nextTime(function () {
        const workMap = map
        map = new Map()
        save(workMap)
      })
    }
    map.set(key, value)
  }
}

export async function bulkGet<K extends string | number, T>(
  ids: K[],
  doGet: (keys: K[]) => Promise<T[]>,
  limit = Infinity
) {
  if (!ids.length) {
    return emptyArray
  }
  const list: Promise<T[]>[] = []
  splitList(ids, limit, function (keys) {
    list.push(doGet(keys))
  })
  const values_1 = await Promise.all(list)
  return values_1.flat()
}

export function createBuilkGet<K extends string | number, T>(
  doGet: (keys: K[]) => Promise<T[]>,
  getId: (v: T) => K,
  {
    limit = Infinity,
    nextTime = messageChannelCallback,
  }: {
    limit?: number
    nextTime?: SetValue<EmptyFun>
  } = emptyObject
) {
  let map = new Map<K, {
    resolve: SetValue<T>
    reject: SetValue<any>
    promise: Promise<T>
  }>()
  return function (key: K) {
    if (!map.size) {
      nextTime(function () {
        const workMap = map
        map = new Map()
        const ids = [...workMap.keys()]
        splitList(ids, limit, function (ids) {
          doGet(ids).then(value => {
            value.forEach(row => {
              const id = getId(row)
              workMap.get(id)?.resolve(row)
            })
            workMap.forEach(item => {
              item.reject('no data found')
            })
          }).catch(err => {
            workMap.forEach(item => {
              item.reject(err)
            })
          })
        })
      })
    }
    const old = map.get(key)
    if (old) {
      return old.promise
    }
    const [promise, resolve, reject] = getOutResolvePromise<T>()
    map.set(key, {
      promise,
      reject,
      resolve
    })
    return promise
  }
}