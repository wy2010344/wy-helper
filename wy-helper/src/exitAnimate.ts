import { ArrayHelper } from "./ArrayHelper"
import { getOutResolvePromise } from "./setStateHelper"
import { StoreRef } from "./storeRef"
import { EmptyFun, defaultToGetTrue, emptyObject } from "./util"


export interface ExitModel<V> {
  key: any
  value: V
  originalKey: any
  enterIgnore?: boolean
  exiting?: boolean
  promise: Promise<any>
  resolve(v?: any): void
}

interface ExitModelImpl<V> extends ExitModel<V> {
  hide?: boolean | ExitModel<V>
}
/**
 * 主要是有一点,可能会回退
 */
export type ExitAnimateMode = 'pop' | 'shift'

export type ExitAnimateArg<V> = {
  mode?: ExitAnimateMode
  wait?: 'in-out' | 'out-in'
  exitIgnore?: any | ((v: V) => any)
  enterIgnore?: any | ((v: V) => any)
  onExitComplete?(v?: any): void
  onEnterComplete?(v?: any): void
  onAnimateComplete?(v?: any): void
}

export function buildUseExitAnimate<V>(
  updateVersion: EmptyFun,
  cacheList: StoreRef<ExitModelImpl<V>[]>,
  getNextId: (v: Promise<any>) => any,
  list: readonly V[],
  getKey: (v: V) => any, {
    mode,
    wait,
    exitIgnore,
    enterIgnore,
    onExitComplete,
    onEnterComplete,
    onAnimateComplete,
  }: ExitAnimateArg<V> = emptyObject
) {

  exitIgnore = defaultToGetTrue(exitIgnore)
  enterIgnore = defaultToGetTrue(enterIgnore)

  const newCacheList = new ArrayHelper(cacheList.get())
  const thisAddList: ExitModelImpl<V>[] = []
  const thisRemoveList: ExitModelImpl<V>[] = []

  newCacheList.forEachRight(function (old, i) {
    if (!old.exiting && !list.some(v => getKey(v) == old.originalKey)) {
      //新删除了
      if (exitIgnore?.(old.value)) {
        newCacheList.removeAt(i)
      } else {
        const [promise, resolve] = getOutResolvePromise()
        const cache: ExitModelImpl<V> = {
          ...old,
          exiting: true,
          promise,
          resolve,
          hide: old
        }
        newCacheList.replace(i, cache)
        thisRemoveList.push(cache)
        promise.then(function () {
          const eCacheList = new ArrayHelper(cacheList.get())
          const n = eCacheList.removeWhere(old => old.key == cache.key)
          if (n) {
            cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
            updateVersion()
          }
        })
      }
    }
  })
  let nextIndex = 0
  for (const v of list) {
    const key = getKey(v)
    const oldIndex = newCacheList.get().findIndex(old => !old.exiting && old.originalKey == key)
    if (oldIndex < 0) {
      if (mode == 'shift') {
        while (newCacheList.get()[nextIndex]?.exiting) {
          nextIndex++
        }
      }
      const [promise, resolve] = getOutResolvePromise()
      const cache: ExitModelImpl<V> = {
        key: getNextId(promise),
        value: v,
        originalKey: key,
        hide: wait == 'out-in' && thisRemoveList.length != 0,
        enterIgnore: enterIgnore?.(v),
        promise,
        resolve
      }
      newCacheList.insert(nextIndex, cache)
      thisAddList.push(cache)
    } else {
      newCacheList.replace(oldIndex, {
        ...newCacheList.get()[oldIndex],
        value: v
      })
      nextIndex = oldIndex + 1
    }
  }
  if (!(thisAddList.length && wait == 'in-out')) {
    thisRemoveList.forEach(row => row.hide = false)
  }
  /**
   * useRef,不应该在render中设置值,官方这样说的
   * useEffect在Strict.Mode会执行两次,所以最好严格修改
   * 在render中创建的promise,当然可能会回滚掉,但是也不会生效.
   */
  // cacheList.current = newCacheList.get() as ExitModelImpl<V>[]
  const tempCacheList = new ArrayHelper(newCacheList.get())
  tempCacheList.forEachRight(hideAsShowAndRemoteHide)
  return {
    list: tempCacheList.get() as readonly ExitModel<V>[],
    effect() {
      const removePromiseList: Promise<any>[] = thisRemoveList.map(v => v.promise)
      if (removePromiseList.length) {
        const allDestroyPromise = Promise.all(removePromiseList)
        if (onExitComplete) {
          allDestroyPromise.then(onExitComplete)
        }
        const onExitWait = wait == 'out-in' && thisAddList.length != 0
        if (onExitWait) {
          allDestroyPromise.then(function () {
            //将本次更新全部标记为展示.
            const eCacheList = new ArrayHelper(cacheList.get())
            let n = 0
            eCacheList.forEach(function (cache, x) {
              if (cache.hide) {
                const row = thisAddList.find(v => v.key == cache.key)
                if (row) {
                  eCacheList.replace(x, {
                    ...cache,
                    hide: false
                  })
                  n++
                }
              }
            })
            if (n) {
              cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
              updateVersion()
            }
          })
        }
      }
      const addPromiseList: Promise<any>[] = []
      for (const thisAdd of thisAddList) {
        if (!enterIgnore?.(thisAdd.value)) {
          addPromiseList.push(thisAdd.promise)
        }
      }
      if (addPromiseList.length) {
        const allEnterPromise = Promise.all(addPromiseList)
        if (onEnterComplete) {
          allEnterPromise.then(onEnterComplete)
        }
        const onEnterWait = wait == 'in-out' && thisRemoveList.length != 0
        if (onEnterWait) {
          allEnterPromise.then(function () {
            //将本次更新全部标记为展示.
            const eCacheList = new ArrayHelper(cacheList.get())
            let n = 0
            eCacheList.forEach(function (cache, x) {
              if (cache.hide) {
                const row = thisRemoveList.find(v => v.key == cache.key)
                if (row) {
                  eCacheList.replace(x, {
                    ...cache,
                    hide: false
                  })
                  n++
                }
              }
            })
            if (n) {
              cacheList.set(eCacheList.get() as ExitModelImpl<V>[])
              updateVersion()
            }
          })
        }
      }
      if (onAnimateComplete && (addPromiseList.length || removePromiseList.length)) {
        Promise.all([...addPromiseList, ...removePromiseList]).then(onAnimateComplete)
      }

      //这里需要处理,因为有一些已经真实删除了,useEffect与render存在异步关系
      const list = cacheList.get()
      newCacheList.forEachRight(function (v, i) {
        if (v.exiting && !list.some(x => x.key == v.key)) {
          newCacheList.removeAt(i)
        }
      })
      cacheList.set(newCacheList.get() as ExitModelImpl<V>[])
    }
  }
}


function hideAsShowAndRemoteHide<T>(v: ExitModelImpl<T>, i: number, array: ArrayHelper<ExitModelImpl<T>>) {
  if (v.hide && v.exiting && typeof v.hide == 'object') {
    v = {
      ...v,
      ...v.hide,
      exiting: false
    }
    array.replace(i, v)
  }
  if (v.hide) {
    array.removeAt(i)
  }
}