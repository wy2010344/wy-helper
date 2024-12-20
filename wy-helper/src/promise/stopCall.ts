import { arrayFunToOneOrEmpty } from "../ArrayHelper"
import { ReducerDispatch, ReducerWithDispatchResult, createReduceValueCenter, mapReducerDispatch } from "../ValueCenter"
import { objectFreeze, quote } from "../util"
import { VersionPromiseResult, hookAbortSignalPromise } from "./buildSerialRequestSingle"

/**
 * 如果使用valueCenter的reducer,将其集中到一个更大的状态
 * valueCenter的好处,有些值不必触发更新
 */
export class PromiseStopCall<T> {
  constructor(
    public readonly requestVersion: number = 0,
    readonly abortController: AbortController | undefined = undefined,
    public readonly data?: Readonly<VersionPromiseResult<T>>
  ) {
    objectFreeze(this)
  }
  static empty = new PromiseStopCall()
  didLoad() {
    return this.requestVersion == this.data?.version
  }
  reloadBack(value: VersionPromiseResult<T>) {
    if (value.version == this.requestVersion) {
      return new PromiseStopCall(
        this.requestVersion,
        undefined,
        value
      )
    }
    return this
  }
  reload(
    getFun: () => Promise<T>
  ) {
    const lc = this.abortController
    const act: ReducerDispatch<VersionPromiseResult<T>> = function (dispatch) {
      lc?.abort()
      hookAbortSignalPromise(c.signal, getFun, value => {
        const v = value as VersionPromiseResult<T>
        v.version = version
        dispatch(v)
      })
    }

    const version = this.requestVersion + 1
    const c = new AbortController()
    return [
      new PromiseStopCall(
        version,
        c,
        this.data
      ),
      act
    ] as const
  }

  setData(fun: (old: T) => T) {
    if (this.data?.type == 'success') {
      return new PromiseStopCall(
        this.requestVersion,
        this.abortController,
        {
          ...this.data,
          value: fun(this.data.value)
        }
      )
    }
    return this
  }
}

export type PromiseStopCallAction<T> = {
  type: "reload",
  getFun(): Promise<T>
} | {
  type: "reloadBack"
  value: VersionPromiseResult<T>
}
export function reducePromiseStopCall<T>(
  old: PromiseStopCall<T>,
  action: PromiseStopCallAction<T>
): ReducerWithDispatchResult<PromiseStopCall<T>, PromiseStopCallAction<T>> {
  if (action.type == 'reload') {
    const [data, act] = old.reload(action.getFun)
    return [data, mapReducerDispatch(act, act => {
      return {
        type: "reloadBack",
        value: act
      }
    })]
  } else if (action.type == "reloadBack") {
    return [old.reloadBack(action.value), undefined]
  }
  return [old, undefined]
}

export function valueCenterPromiseStopCall<T>() {
  return createReduceValueCenter<PromiseStopCall<T>, PromiseStopCallAction<T>>(
    reducePromiseStopCall,
    PromiseStopCall.empty as any)
}


export type AutoLoadMoreCore<T, K> = {
  nextKey: K,
  list: T[]
  hasMore: boolean
}
export class PromiseAutoLoadMore<T, K> {
  constructor(
    public readonly data = PromiseStopCall.empty as PromiseStopCall<{
      nextKey: K,
      list: T[]
      loadMoreError?: any
      hasMore: boolean
    }>,
    private readonly getFun: ((k: K) => Promise<AutoLoadMoreCore<T, K>>) | undefined = undefined,
    private readonly getKey: (n: T) => any = quote,
    public readonly isLoadingMore = false,
    readonly loadMoreAbortController: AbortController | undefined = undefined
  ) {
    objectFreeze(this)
  }
  static empty = new PromiseAutoLoadMore()
  reload(
    getFun: (k: K) => Promise<AutoLoadMoreCore<T, K>>,
    first: K,
    getKey: (v: T) => any = quote
  ) {
    const that = this
    const [data, act] = this.data.reload(function () {
      return getFun(first)
    })
    return [
      new PromiseAutoLoadMore(
        data,
        getFun,
        getKey,
        false
      ),
      function (dispatch) {
        that.loadMoreAbortController?.abort()
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
      this.getKey,
      false
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
    if (!this.data.data.value.hasMore) {
      return this
    }
    const c = new AbortController()
    const that = this

    list.push(function (dispatch) {
      hookAbortSignalPromise(c.signal, () => {
        return that.getFun!(that.data.data!.value.nextKey)
      }, value => {
        const v = value as VersionPromiseResult<AutoLoadMoreCore<T, K>>
        v.version = version
        dispatch(v)
      })
    })
    return new PromiseAutoLoadMore(
      this.data,
      this.getFun,
      this.getKey,
      true,
      c
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
          const newList = v.value.list.filter(x => {
            const key = this.getKey(x)
            return !old.list.find(v => this.getKey(v) == key)
          })
          return {
            ...old,
            ...v.value,
            list: [...old.list, ...newList]
          }
        } else {
          return {
            ...old,
            loadMoreError: v.value
          }
        }
      }),
      this.getFun,
      this.getKey,
      undefined
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
        return new PromiseAutoLoadMore(
          newData,
          this.getFun,
          this.getKey,
          this.isLoadingMore,
          this.loadMoreAbortController)
      }
    }
    return this
  }


  refresh(
    getFun: () => Promise<AutoLoadMoreCore<T, K>>
  ) {
    const that = this
    const [data, act] = this.data.reload(getFun)
    return [
      new PromiseAutoLoadMore(
        data,
        this.getFun,
        this.getKey,
        false
      ),
      function (dispatch) {
        that.loadMoreAbortController?.abort()
        act(dispatch)
      } as typeof act
    ] as const
  }
}


export type AutoLoadMoreAction<T, K> =
  {
    type: "reload";
    getAfter(k: K): Promise<AutoLoadMoreCore<T, K>>
    first: K
    getKey?(v: T): any
  } | {
    type: "loadMore";
    version: number
  } | {
    type: "reloadBack"
    value: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  } | {
    type: "loadMoreBack"
    value: VersionPromiseResult<AutoLoadMoreCore<T, K>>
  } | {
    type: "refersh",
    call(): Promise<AutoLoadMoreCore<T, K>>
  }
  | Update<T>;

type Update<T> = {
  type: "update";
  callback(old: T[]): T[]
}

type AutoModel<T, K> = ReducerWithDispatchResult<PromiseAutoLoadMore<T, K>, AutoLoadMoreAction<T, K>>
export function reducerAutoLoadMore<T, K>(
  old: PromiseAutoLoadMore<T, K>,
  action: AutoLoadMoreAction<T, K>
): AutoModel<T, K> {
  if (action.type == "reload") {
    const [value, act] = old.reload(
      action.getAfter,
      action.first,
      action.getKey
    )
    return [value, mapReducerDispatch(act, value => {
      return {
        type: "reloadBack",
        value
      }
    })]
  } else if (action.type == "loadMore") {
    const [value, act] = old.loadMore(action.version)
    return [value, mapReducerDispatch(act, value => {
      return {
        type: "loadMoreBack",
        value
      }
    })]
  } else if (action.type == 'reloadBack') {
    return [old.reloadBack(action.value), undefined]
  } else if (action.type == 'loadMoreBack') {
    return [old.loadMoreBack(action.value), undefined]
  } else if (action.type == 'update') {
    return [old.update(action.callback), undefined]
  } else if (action.type == "refersh") {
    const [value, act] = old.refresh(action.call)
    return [value, mapReducerDispatch(act, value => {
      return {
        type: "reloadBack",
        value
      }
    })]
  }
  return [old, undefined];
}

export function valueCenterAutoLoadMore<T, K>() {
  return createReduceValueCenter<PromiseAutoLoadMore<T, K>, AutoLoadMoreAction<T, K>>(
    reducerAutoLoadMore,
    PromiseAutoLoadMore.empty as any)
}