import { GetValue } from "../setStateHelper";
import { createSignal, memo, trackSignal } from "../signal";
import { FalseType, Quote } from "../util";
import { AbortPromiseResult, serialAbortRequest } from "./buildSerialRequestSingle";

export function signalSerialAbortPromise<T>(
  generatePromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const memoGeneratePromise = memo(generatePromise)
  const signal = createSignal<AbortPromiseResult<T> | undefined>(undefined)
  const abortRequest = serialAbortRequest<T>(signal.set)
  const destroy = trackSignal(memoGeneratePromise, function (getPromise) {
    if (getPromise) {
      abortRequest(getPromise)
    }
  })

  //状态值
  function get() {
    if (memoGeneratePromise()) {
      return signal.get()
    }
    return undefined
  }

  //如果是成功状态,更新值
  function reduceSet(callback: Quote<T>) {
    const value = get()
    if (value?.type == 'success') {
      signal.set({
        ...value,
        value: callback(value.value)
      })
    }
  }

  //是否正在加载中
  function loading() {
    const request = memoGeneratePromise()
    if (request) {
      //是否正在加载中
      return request != signal.get()?.request
    }
    return false;
  }
  return {
    destroy,
    get,
    reduceSet,
    loading
  }
}