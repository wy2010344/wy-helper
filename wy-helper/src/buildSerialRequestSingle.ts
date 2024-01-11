import { ReduceState } from "./setStateHelper"
import { FalseType, emptyFun } from "./util"

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
  effect: (res: PromiseResult<Res>) => void = emptyFun,
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
        callback(...cacheList[0])
          .then(res => {
            if (checkRun()) {
              effect({
                type: "success",
                value: res
              })
            }
          })
          .catch(err => {
            if (checkRun()) {
              effect({
                type: "error",
                value: err
              })
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
