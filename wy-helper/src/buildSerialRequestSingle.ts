import { ReduceState, SetValue } from "./setStateHelper"
import { EmptyFun, FalseType, emptyFun, messageChannelCallback, objectFreeze, run, supportMicrotask } from "./util"

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
  cacheList: Req[] = [],
  delay = run
) {
  function checkRun() {
    cacheList.shift()
    if (cacheList.length) {
      //如果有值,继续操作
      circleRun()
      return false
    }
    return true
  }
  function didCircleRun() {
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
  function circleRun() {
    delay(didCircleRun)
  }
  return function (...vs: Req) {
    cacheList.push(vs)
    if (cacheList.length == 1) {
      //之前是空的
      circleRun()
    }
  }
}



export function buildThrottle<T>(didRun: (fun: () => void) => void, callback: SetValue<T>) {
  let lastValue: T | undefined
  let requestedWork = false
  return function (value: T) {
    lastValue = value
    if (requestedWork) {
      return
    }
    requestedWork = true
    didRun(function () {
      requestedWork = false
      callback(lastValue!)
    })
  }
}
export function timeOutThrottle(callback: EmptyFun, time?: number): EmptyFun
export function timeOutThrottle<T>(callback: SetValue<T>, time?: number): SetValue<T>
export function timeOutThrottle(callback: EmptyFun, time: number = 0) {
  return buildThrottle(function (fun) {
    setTimeout(fun, time)
  }, callback)
}
export function messageChannelThrottle(callback: EmptyFun): EmptyFun
export function messageChannelThrottle<T>(callback: SetValue<T>): SetValue<T>
export function messageChannelThrottle(callback: EmptyFun) {
  return buildThrottle(messageChannelCallback, callback)
}

export function microTaskThrottle(callback: EmptyFun): EmptyFun
export function microTaskThrottle<T>(callback: SetValue<T>): SetValue<T>
export function microTaskThrottle(callback: EmptyFun) {
  if (supportMicrotask) {
    return buildThrottle(queueMicrotask, callback)
  } else {
    return messageChannelThrottle(callback)
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

/**
 * 如果使用valueCenter的reducer,将其集中到一个更大的状态
 * valueCenter的好处,有些值不必触发更新
 */
export class PromiseStopCall<T>{
  constructor(
    public readonly requestVersion: number = 0,
    private readonly lastCancel: EmptyFun = emptyFun,
    public readonly data?: Readonly<VersionPromiseResult<T>>
  ) {
    objectFreeze(this)
  }
  didLoad() {
    return this.requestVersion == this.data?.version
  }
  reloadBack(value: VersionPromiseResult<T>) {
    if (value.version == this.requestVersion) {
      return new PromiseStopCall(
        this.requestVersion,
        emptyFun,
        value
      )
    }
    return this
  }
  reload(
    getFun: (abortSignal?: AbortSignal) => Promise<T>,
    dispatch: (value: VersionPromiseResult<T>) => void
  ) {
    this.lastCancel()
    const version = this.requestVersion + 1
    const c = createAbortController()
    getFun(c.signal).then(value => {
      dispatch({
        type: "success",
        value,
        version
      })
    }).catch(err => {
      dispatch({
        type: "error",
        value: err,
        version
      })
    })
    return new PromiseStopCall(
      version,
      c.cancel,
      this.data
    )
  }

  setData(fun: (old: T) => T) {
    if (this.data?.type == 'success') {
      return new PromiseStopCall(
        this.requestVersion,
        this.lastCancel,
        {
          ...this.data,
          value: fun(this.data.value)
        }
      )
    }
    return this
  }
}



export type AutoLoadMoreCore<T, K> = {
  nextKey: K,
  list: T[]
  hasMore: boolean
}
export class PromiseAutoLoadMore<T, K>{
  constructor(
    public readonly data = new PromiseStopCall<{
      nextKey: K,
      list: T[]
      loadMoreError?: any
      hasMore: boolean
    }>(),
    private readonly getFun: ((k: K, abort?: AbortSignal) => Promise<AutoLoadMoreCore<T, K>>) | undefined = undefined,
    public readonly isLoadingMore = false,
    private readonly loadMoreCancel = emptyFun
  ) {
    objectFreeze(this)
  }
  reload(
    getFun: (k: K, abort?: AbortSignal) => Promise<{
      list: T[]
      nextKey: K
      hasMore: boolean
    }>,
    first: K,
    dispatch: (v: VersionPromiseResult<AutoLoadMoreCore<T, K>>) => void
  ) {
    this.loadMoreCancel()
    return new PromiseAutoLoadMore(
      this.data.reload(function (signal) {
        return getFun(first, signal)
      }, dispatch),
      getFun,
      false,
      emptyFun
    )
  }
  reloadBack(v: VersionPromiseResult<AutoLoadMoreCore<T, K>>) {
    const u = this.data.reloadBack(v)
    if (u == this.data) {
      return this
    }
    return new PromiseAutoLoadMore(
      u,
      this.getFun,
      false,
      emptyFun
    )
  }

  loadMore(
    version: number,
    dispatch: SetValue<VersionPromiseResult<AutoLoadMoreCore<T, K>>>
  ) {
    if (!this.getFun) {
      return this
    }
    if (this.isLoadingMore) {
      return this
    }
    if (this.data.data?.type != 'success') {
      return this
    }
    if (!this.data.didLoad()) {
      return this
    }
    if (version != this.data.requestVersion) {
      return this
    }
    const c = createAbortController()
    this.getFun(this.data.data.value.nextKey, c.signal).then(value => {
      dispatch({
        value,
        version,
        type: "success"
      })
    }).catch(err => {
      dispatch({
        value: err,
        version,
        type: "error"
      })
    })
    return new PromiseAutoLoadMore(
      this.data,
      this.getFun,
      true,
      c.cancel
    )
  }

  loadMoreBack(v: VersionPromiseResult<AutoLoadMoreCore<T, K>>) {
    if (v.version != this.data.requestVersion) {
      return this
    }
    return new PromiseAutoLoadMore(
      this.data.setData(old => {
        if (v.type == 'success') {
          return {
            ...old,
            ...v.value,
            list: [...old.list, ...v.value.list]
          }
        } else {
          return {
            ...old,
            loadMoreError: v.value
          }
        }
      }),
      this.getFun,
      false,
      emptyFun
    )
  }
}