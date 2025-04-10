import { Compare } from "../equal";
import { GetValue } from "../setStateHelper";
import { createSignal, memo, trackSignal } from "../signal";
import { FalseType, Quote } from "../util";
import { AbortPromiseResult, hookAbortSignalPromise, serialAbortRequest } from "./buildSerialRequestSingle";
import { AutoLoadMoreCore } from "./stopCall";

export function signalSerialAbortPromise<T>(
  generatePromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const signal = createSignal<AbortPromiseResult<T> | undefined>(undefined)
  const abortRequest = serialAbortRequest<T>(signal.set)



  const memoGeneratePromise = memo(generatePromise)
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



export function signalSerialAbortPromiseLoadMore<T, K, M = {}>(
  generateReload: GetValue<{
    getAfter(k: K): Promise<AutoLoadMoreCore<T, K> & M>,
    first: K
  } | FalseType>,
  equals?: Compare<T>
) {
  const memoGenerateReload = memo(generateReload)
  const getPromise = memo(() => {
    const reload = memoGenerateReload()
    if (reload) {
      return function () {
        return reload.getAfter(reload.first)
      }
    }
  })
  const d = signalSerialAbortPromise(getPromise)
  const loadingMore = createSignal(false)
  const lastloadMoreError = createSignal<any>(undefined)
  return {
    ...d,
    loadingMore: loadingMore.get,
    lastLoadMoreError: lastloadMoreError.get,
    /**loadMore是阻塞的*/
    loadMore() {
      if (d.loading()) {
        //重新加载中,不行
        return false
      }
      if (loadingMore.get()) {
        return false
      }
      const data = d.get()
      if (data?.type != 'success') {
        return false
      }
      if (!data.value.hasMore) {
        return false
      }
      const reload = memoGenerateReload()
      if (!reload) {
        return false
      }
      loadingMore.set(true)
      reload.getAfter(data.value.nextKey).then(value => {
        d.reduceSet(oldValue => {
          let newList = oldValue.list
          if (equals) {
            newList = [...oldValue.list]
            value.list.forEach(row => {
              const idx = newList.findIndex(x => equals(row, x))
              if (idx < 0) {
                newList.push(row)
              } else {
                newList.splice(idx, 1, row)
              }
            })
          } else {
            newList = newList.concat(value.list)
          }
          return {
            ...value,
            list: newList
          }
        })
        lastloadMoreError.set(undefined)
        loadingMore.set(false)
      }).catch(error => {
        lastloadMoreError.set(error)
        loadingMore.set(false)
      })
      return true
    }
  }
}