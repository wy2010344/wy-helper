import { SetValue, getOutResolvePromise } from "../setStateHelper"
import { DelayCall, EmptyFun, run } from "../util"




const observerCenter = {
  waitList: [] as PromiseWait<void>[],
  on: false,
  version: 0,
  set: new Set<ObserverCellImpl<any, any>>(),
  delayCallList: [] as EmptyFun[]
}

interface ObserverCell<M> {
  get(): Promise<M>
  destroy(): void
}


export interface PromiseWait<T> {
  resolve: SetValue<T>,
  reject: EmptyFun
}

export function resolveAll<T>(list: PromiseWait<T>[], value: T) {
  list.forEach(row => {
    row.resolve(value)
  })
}
export function rejectAll<T>(list: PromiseWait<T>[], err: any) {
  list.forEach(row => {
    row.reject(err)
  })
}

class ObserverCellImpl<M, T extends {
  value: M
}> implements ObserverCell<M> {
  constructor(
    private reducer: (old: T) => Promise<T>,
    private data: T
  ) {
    observerCenter.set.add(this)
  }
  private dataVersion = observerCenter.version
  private list!: PromiseWait<M>[]
  async get() {
    if (this.dataVersion != observerCenter.version) {
      const [promise, resolve, reject] = getOutResolvePromise<M>()
      let start = false
      if (!this.list) {
        start = true
        this.list = []
      }
      this.list.push({
        resolve,
        reject
      })
      if (start) {
        this.reducer(this.data)
          .then(value => {
            this.data = value
            resolveAll(this.list, this.data.value)
            this.list = undefined as any
            this.dataVersion = observerCenter.version
          })
          .catch(err => {
            rejectAll(this.list, err)
          })
      }
      return promise
    }
    return this.data.value
  }
  destroy() {
    observerCenter.set.delete(this)
  }
}

export function createSyncCell<M, T extends {
  value: M
}>(
  reducer: (old: T) => Promise<T>,
  init: T
) {
  return new ObserverCellImpl(reducer, init)
}

export async function syncRefresh(delay?: DelayCall) {
  const [promise, resolve, reject] = getOutResolvePromise()
  observerCenter.waitList.push({
    resolve,
    reject
  })
  if (!observerCenter.on) {
    if (delay) {
      observerCenter.delayCallList.push(delay(delayCall))
    } else {
      delayCall()
    }
  }
  return promise
}


async function didCall() {
  const list = observerCenter.waitList
  observerCenter.waitList = []
  //这里要做重入检查,
  try {
    observerCenter.version = observerCenter.version + 1
    const promises: Promise<any>[] = []
    for (const row of observerCenter.set) {
      promises.push(row.get())
    }
    await Promise.all(promises)
    resolveAll(list, undefined)
  } catch (err) {
    rejectAll(list, err)
  }
  if (observerCenter.waitList.length) {
    didCall()
  } else {
    observerCenter.on = false
  }
}

function delayCall() {
  observerCenter.on = true
  //得到一处通知,立即清理
  observerCenter.delayCallList.forEach(run)
  observerCenter.delayCallList.length = 0
  didCall()
}