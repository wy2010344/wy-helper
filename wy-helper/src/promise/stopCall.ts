import { arrayFunToOneOrEmpty } from "../ArrayHelper"
import { ReducerDispatch } from "../ValueCenter"
import { EmptyFun, emptyFun, objectFreeze } from "../util"
import { VersionPromiseResult, createAbortController } from "./buildSerialRequestSingle"

/**
 * 如果使用valueCenter的reducer,将其集中到一个更大的状态
 * valueCenter的好处,有些值不必触发更新
 */
export class PromiseStopCall<T> {
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
    getFun: (abortSignal?: AbortSignal) => Promise<T>
  ) {
    const lc = this.lastCancel
    const act: ReducerDispatch<VersionPromiseResult<T>> = function (dispatch) {
      lc()
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
    }

    const version = this.requestVersion + 1
    const c = createAbortController()
    return [
      new PromiseStopCall(
        version,
        c.cancel,
        this.data
      ),
      act
    ] as const
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
export class PromiseAutoLoadMore<T, K> {
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
    getFun: (k: K, abort?: AbortSignal) => Promise<AutoLoadMoreCore<T, K>>,
    first: K
  ) {
    const that = this
    const [data, act] = this.data.reload(function (signal) {
      return getFun(first, signal)
    })
    return [
      new PromiseAutoLoadMore(
        data,
        getFun,
        false,
        emptyFun
      ),
      function (dispatch) {
        that.loadMoreCancel()
        act(dispatch)
      } as typeof act
    ] as const
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

  private loadMoreList(version: number, list: ReducerDispatch<VersionPromiseResult<AutoLoadMoreCore<T, K>>>[]) {

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
    const that = this

    list.push(function (dispatch) {
      that.getFun!(that.data.data!.value.nextKey, c.signal).then(value => {
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
    })
    return new PromiseAutoLoadMore(
      this.data,
      this.getFun,
      true,
      c.cancel
    )
  }
  loadMore(
    version: number
  ) {
    const list: ReducerDispatch<VersionPromiseResult<AutoLoadMoreCore<T, K>>>[] = []
    const data = this.loadMoreList(version, list)
    return [
      data,
      arrayFunToOneOrEmpty(list)
    ] as const
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

  update(callback: (list: T[]) => T[]) {
    if (this.data.data?.type == 'success') {
      const newData = this.data.setData(old => {
        return {
          ...old,
          list: callback(old.list)
        }
      })
      if (newData != this.data) {
        return new PromiseAutoLoadMore(newData, this.getFun, this.isLoadingMore, this.loadMoreCancel)
      }
    }
    return this
  }
}