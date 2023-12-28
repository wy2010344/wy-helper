


/**
 * 如果正在请求,则加入这个队列
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