import { createReduceValueCenter, valueCenterOf } from "."
import { ReduceState } from "./setStateHelper"
import { EmptyFun, FalseType, emptyFun } from "./util"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}

export type PromiseResultSuccessValue<T> = T extends {
  type: "success"
  value: infer V
} ? V : never
export type VersionPromiseResult<T> = PromiseResult<T> & {
  version: number
}
export type GetPromiseRequest<T> = (signal?: AbortSignal, ...vs: any[]) => Promise<T>;
export type OnVersionPromiseFinally<T> = (
  data: VersionPromiseResult<T>,
  ...vs: any[]
) => void
export function createAbortController() {
  if ("AbortController" in globalThis) {
    const signal = new AbortController();
    return {
      signal: signal.signal,
      cancel() {
        signal.abort();
      },
    };
  }
  return {
    signal: undefined,
    cancel: emptyFun,
  };
}

export type OutPromiseOrFalse<T> = (GetPromiseRequest<T>) | FalseType;

export function buildSerialRequestSingle<Req extends any[], Res>(
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>, req: Req) => void = emptyFun,
  cacheList: Req[] = []
) {
  return function (...vs: Req) {
    cacheList.push(vs)
    if (cacheList.length == 1) {
      //之前是空的
      const checkRun = () => {
        cacheList.shift()
        if (cacheList.length) {
          //如果有值,继续操作
          circleRun()
          return false
        }
        return true
      }
      const circleRun = () => {
        while (cacheList.length > 1) {
          cacheList.shift()
        }
        const req = cacheList[0]
        callback(...req)
          .then(res => {
            if (checkRun()) {
              effect({
                type: "success",
                value: res
              }, req)
            }
          })
          .catch(err => {
            if (checkRun()) {
              effect({
                type: "error",
                value: err
              }, req)
            }
          })
      }
      circleRun()
    }
  }
}


export function buildPromiseResultSetData<F extends PromiseResult<any>>(
  updateData: ReduceState<F | undefined>
): ReduceState<PromiseResultSuccessValue<F>> {
  return function setData(fun) {
    updateData((old) => {
      if (old?.type == "success") {
        return {
          ...old,
          value: typeof fun == "function" ? (fun as any)(old.value) : fun,
        };
      }
      return old;
    });
  };
}




type PromiseStopCallT<T> = {
  data?: VersionPromiseResult<T>
  lastCancel: EmptyFun
  lastRequestVersion: number
}
export const promiseStopCallInit: PromiseStopCallT<any> = {
  lastCancel: emptyFun,
  lastRequestVersion: 1
}

export function promiseStopCallReduce<T>(
  data: PromiseStopCallT<T>,
  action: VersionPromiseResult<T> | {
    type: "begin"
    getFun(abortSignal?: AbortSignal): Promise<T>
    dispatch(out: VersionPromiseResult<T>): void
  } | {
    type: "setData"
    callback(old: T): T
  }
): PromiseStopCallT<T> {
  if (action.type == 'begin') {
    data.lastCancel()
    const c = createAbortController()
    const version = data.lastRequestVersion + 1
    action.getFun(c.signal).then(value => {
      action.dispatch({
        type: "success",
        value,
        version
      })
    }).catch(err => {
      action.dispatch({
        type: "error",
        value: err,
        version
      })
    })
    return {
      ...data,
      lastRequestVersion: version,
      lastCancel: c.cancel
    }
  } else if (action.type == 'setData') {
    if (data.data?.type == 'success') {
      return {
        ...data,
        data: {
          ...data.data,
          value: action.callback(data.data?.value)
        }
      }
    }
  } else if (action.version == data.lastRequestVersion) {
    return {
      ...data,
      data: action.value,
      lastCancel: emptyFun
    }
  }
  return data
}


type AutoLoadMoreCore<T, K> = {
  nextKey: K,
  list: T[]
  hasMore: boolean
}

export type PromiseAutoLoadMoreT<T, K> = {
  data: PromiseStopCallT<{
    nextKey: K,
    list: T[]
    hasMore: boolean
    loadMoreError?: any
  }>
  getFun?(k: K, abort?: AbortSignal): Promise<AutoLoadMoreCore<T, K>>
  isLoadMore: boolean
  loadMoreCancel: EmptyFun
}
export function promiseAutoLoadMoreReduce<T, K>(
  data: PromiseAutoLoadMoreT<T, K>,
  action: {
    type: "reload"
    getFun(k: K, abort?: AbortSignal): Promise<AutoLoadMoreCore<T, K>>,
    first: K,
    dispatch(out: VersionPromiseResult<AutoLoadMoreCore<T, K>>): void
  } | {
    type: "loadMore"
    version: number
    dispatch(out: VersionPromiseResult<AutoLoadMoreCore<T, K>>): void
  } | {
    type: "reloadBack"
    data: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  } | {
    type: "loadMoreBack"
    data: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  } | {
    type: "setData"
    callback(old: T[]): T[]
  }
): PromiseAutoLoadMoreT<T, K> {
  if (action.type == "reload") {
    data.loadMoreCancel()
    return {
      ...data,
      data: promiseStopCallReduce(data.data, {
        type: "begin",
        getFun(abortSignal) {
          return action.getFun(action.first, abortSignal)
        },
        dispatch: action.dispatch,
      }),
      getFun: action.getFun,
      isLoadMore: false,
      loadMoreCancel: emptyFun
    }
  } else if (action.type == "reloadBack") {
    const u = promiseStopCallReduce(data.data, action.data)
    if (u != data.data) {
      return {
        ...data,
        data: u
      }
    }
  } else if (action.type == 'loadMore') {
    if (!data.getFun) {
      return data
    }
    if (data.isLoadMore) {
      return data
    }
    const stopData = data.data
    if (stopData.data?.type != 'success' || stopData.lastRequestVersion != stopData.data.version) {
      return data
    }
    if (action.version != stopData.lastRequestVersion) {
      return data
    }
    const c = createAbortController()
    data.getFun(stopData.data.value.nextKey, c.signal).then(value => {
      action.dispatch({
        type: "success",
        value,
        version: action.version
      })
    }).catch(err => {
      action.dispatch({
        type: "error",
        value: err,
        version: action.version
      })
    })
    return {
      ...data,
      isLoadMore: true,
      loadMoreCancel: c.cancel
    }
  } else if (action.type == 'loadMoreBack') {
    const stopData = data.data
    if (action.data.version != stopData.lastRequestVersion) {
      return data
    }
    return {
      ...data,
      data: promiseStopCallReduce(stopData, {
        type: "setData",
        callback(old) {
          if (action.data.type == 'success') {
            return {
              ...old,
              ...action.data.value,
              loadMoreError: undefined,
              list: [...old.list, ...action.data.value.list]
            }
          } else {
            return {
              ...old,
              loadMoreError: action.data.value
            }
          }
        }
      }),
      loadMoreCancel: emptyFun,
      isLoadMore: false
    }
  } else if (action.type == 'setData') {
    if (data.data.data?.type == 'success') {
      return {
        ...data,
        data: {
          ...data.data,
          data: {
            ...data.data.data,
            value: {
              ...data.data.data.value,
              list: action.callback(data.data.data.value.list)
            }
          }
        }
      }
    }
  }
  return data
}

export const promiseAutoLoadMoreInit: PromiseAutoLoadMoreT<any, any> = {
  data: promiseStopCallInit,
  isLoadMore: false,
  loadMoreCancel: emptyFun
}

/**
 * 如果使用valueCenter的reducer,将其集中到一个更大的状态
 * valueCenter的好处,有些值不必触发更新
 */
export class PromiseStopCall<T>{

  private lastCancel = emptyFun
  private lastRequestVersion = valueCenterOf(1)
  readonly requestVersion = this.lastRequestVersion.readonly()
  private clearLast(fail?: boolean) {
    if (fail) {
      this.lastCancel()
    }
    this.lastCancel = emptyFun
  }
  private prepareClear() {
    const c = createAbortController()
    this.lastCancel = c.cancel
    return c.signal
  }
  async reload(getFun: (abortSignal?: AbortSignal) => Promise<T>): Promise<VersionPromiseResult<T> | void> {
    this.clearLast(true)
    const version = this.lastRequestVersion.get() + 1
    this.lastRequestVersion.set(version)
    const signal = this.prepareClear()
    try {
      const value = await getFun(signal)
      if (version == this.lastRequestVersion.get()) {
        this.clearLast()
        return {
          type: "success",
          value,
          version
        }
      }
    } catch (err) {
      if (version == this.lastRequestVersion.get()) {
        this.clearLast()
        return {
          type: "error",
          value: err,
          version
        }
      }
    }
  }
}
export class PromiseStopCallStore<T> extends PromiseStopCall<T>{
  private store = valueCenterOf<VersionPromiseResult<T> | undefined>(undefined)
  public readonly data = this.store.readonly()
  async reload(getFun: (abortSignal?: AbortSignal) => Promise<T>) {
    const value = await super.reload(getFun)
    if (value) {
      this.store.set(value)
    }
    return value
  }
  setData(fun: (old: T) => T) {
    const d = this.store.get()
    if (d?.type == 'success') {
      this.store.set({
        ...d,
        value: fun(d.value)
      })
      return true
    }
    return false
  }
}
export class PromiseAutoLoadMore<T, K>{
  private call = new PromiseStopCallStore<{
    nextKey: K,
    list: T[]
    loadMoreError?: any
    hasMore: boolean
  }>()
  readonly data = this.call.data
  private getFun: ((k: K, abort?: AbortSignal) => Promise<{
    list: T[]
    nextKey: K
    hasMore: boolean
  }>) | undefined = undefined
  reload(
    getFun: (k: K, abort?: AbortSignal) => Promise<{
      list: T[]
      nextKey: K
      hasMore: boolean
    }>,
    first: K,
  ) {
    this.getFun = getFun
    this.clearLoadMore(true)
    this.call.reload(async function (abort) {
      return getFun(first, abort)
    })
  }


  private isLoadMore = valueCenterOf(false)
  readonly loadingMore = this.isLoadMore.readonly()
  private loadMoreCancel = emptyFun
  private clearLoadMore(fail?: boolean) {
    this.isLoadMore.set(false)
    if (fail) {
      this.loadMoreCancel()
    }
    this.loadMoreCancel = emptyFun
  }
  private prepareLoadMore() {
    this.isLoadMore.set(true)
    const c = createAbortController()
    this.loadMoreCancel = c.cancel
    return c.signal
  }

  /**一般需要UI准备好后才能执行,即useEffect里.*/
  async getMore(version: number) {
    if (!this.getFun) {
      //没有设置过
      return
    }
    if (this.isLoadMore.get()) {
      //正在加载更多
      return
    }
    const data = this.call.data.get()
    if (data?.type != 'success' || data?.version != this.call.requestVersion.get()) {
      //主体失败,或主体正在加载中
      return
    }
    if (version != data.version) {
      //需要等当然版本渲染到UI上才能触发
      return
    }
    const flagVersion = data.version
    const signal = this.prepareLoadMore()
    try {
      const value = await this.getFun(data.value.nextKey, signal)
      if (flagVersion == this.call.requestVersion.get()) {
        this.clearLoadMore()
        this.call.setData(old => {
          return {
            ...old,
            ...value,
            loadMoreError: undefined,
            list: [...old.list, ...value.list]
          }
        })
        return value
      }
    } catch (err) {
      if (flagVersion == this.call.requestVersion.get()) {
        this.clearLoadMore()
        this.call.setData(old => {
          return {
            ...old,
            loadMoreError: err
          }
        })
        throw err
      }
    }
  }
}