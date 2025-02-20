import { GetValue, ReduceState, SetValue } from "../setStateHelper"
import { StoreRef } from "../storeRef"
import { EmptyFun, FalseType, Flatten, emptyFun, messageChannelCallback, objectFreeze, run, supportMicrotask } from "../util"

export type PromiseResult<T> = {
  type: "success",
  promise: Promise<T>
  value: T
} | {
  type: "error",
  promise: Promise<T>
  value: any
}

export type PromiseResultSuccessValue<T> = T extends {
  type: "success"
  value: infer V
} ? V : never
export type GetPromiseRequest<T> = () => Promise<T>;


export type VersionPromiseResult<T> = Flatten<PromiseResult<T> & {
  version: number
}>
export type RequestPromiseResult<T> = Flatten<PromiseResult<T> & {
  /**主要是用来判断Loading状态 */
  request: GetPromiseRequest<T>;
}>
export type RequestPromiseFinally<T> = (data: RequestPromiseResult<T>, ...vs: any[]) => void


export type RequestVersionPromiseReulst<T> = Flatten<RequestPromiseResult<T> & VersionPromiseResult<T>>
export type RequestVersionPromiseFinally<T> = (data: RequestVersionPromiseReulst<T>, ...vs: any[]) => void

const w = globalThis as {
  __abort_signal__?: AbortSignal
}

export function hookAbortSignalPromise<T>(
  signal: AbortSignal,
  fun: GetValue<Promise<T>>,
  callback: SetValue<PromiseResult<T>>
) {
  w.__abort_signal__ = signal
  const p = fun()
  w.__abort_signal__ = undefined
  p.then(v => {
    if (signal.aborted) {
      return
    }
    callback({
      type: "success",
      promise: p,
      value: v
    })
  }).catch(err => {
    if (signal.aborted) {
      return
    }
    callback({
      type: "error",
      promise: p,
      value: err
    })
  })
}
export function hookGetAbortSignal() {
  return w.__abort_signal__
}
export type OnVersionPromiseFinally<T> = (
  data: VersionPromiseResult<T>,
  ...vs: any[]
) => void

export function createAndFlushAbortController() {
  let last: AbortController | undefined = undefined
  let lastSet: SetValue<boolean> = emptyFun
  return function (setValue: SetValue<boolean> = emptyFun) {
    last?.abort()
    lastSet(false)
    last = new AbortController()
    lastSet = setValue
    return last.signal
  }
}

export type OutPromiseOrFalse<T> = (GetPromiseRequest<T>) | FalseType;
/**
 * 串行挪
 * @param callback 执行体
 * @param effect 执行完成后回调
 * @param cacheList 缓存请求参数
 * @param delay 如何延迟下一场请求
 * @returns 
 */
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
    const promise = callback(...req)
    promise.then(res => {
      if (checkRun()) {
        effect({
          type: "success",
          promise,
          value: res
        }, req)
      }
    })
      .catch(err => {
        if (checkRun()) {
          effect({
            type: "error",
            promise,
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
      return true
    }
    return false
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
