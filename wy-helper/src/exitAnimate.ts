import { ArrayHelper, NoInsertArrayHelper } from "./ArrayHelper"
import { getOutResolvePromise } from "./setStateHelper"
import { EmptyFun, alawaysFalse, defaultToGetTrue, emptyArray, emptyObject } from "./util"


interface ExitModelInner<V> {
  key: any
  value: V
  originalKey: any
  enterIgnore?: boolean
  step: "exiting" | "will-exiting" | "will-enter" | "enter"
  promise: Promise<any>
  resolve(v?: any): void
}

export type ExitModel<T> = Omit<ExitModelInner<T>, 'step'> & {
  step: "exiting" | "will-exiting" | "enter"
}
/**
 * 主要是有一点,可能会回退
 */
export type ExitAnimateMode = 'pop' | 'shift'
export type ExitAnimateWait = 'in-out' | 'out-in'
export type ExitAnimateArg<V> = {
  mode?: ExitAnimateMode
  wait?: ExitAnimateWait
  exitIgnore?: any | ((v: V) => any)
  enterIgnore?: any | ((v: V) => any)
  onExitComplete?(v?: any): void
  onEnterComplete?(v?: any): void
  onAnimateComplete?(v?: any): void
}

export function createEmptyExitListCache() {
  return {
    list: []
  }
}
function isExitingItem(v: ExitModelInner<any>) {
  return v.step == 'exiting' || v.step == 'will-exiting'
}
export function buildUseExitAnimate<V>(
  updateVersion: EmptyFun,
  //需要保持稳定不变
  cacheList: {
    list: readonly ExitModelInner<V>[],
    /**
     * 主要是应对render过程中,发生promise事件触发,因为effect阶段才提交到list上面.
     * 乐观情况,非render阶段是空,计算量为0
     * 悲观情况,发生了回退,但操作到真实的cacheList上,下次render到这里会重置
     * 中间情况,即render时发生.
     * 不支持strict mode时,effect执行两次.
     * 
     * 其实better里的memo,有回退的状态,与其如此,不如模仿better-react的memo.
     * 其实应该是一种reduceList,即始终更新过来,然后与最新的list合并生成结果
     * 
     * 每次render中通过cacheList.list生成newCacheList,这个newCacheList会在render中被修改生成新的副本list
     * 这个副本list需要在effect阶段再合并进cacheList.list,通过的就是renderHelper
     * 此外cacheList.list就是在promise完成后被修改(三处),此时可能在render中,拿到的不是最新修改的newCacheList
     * 即如果修改renderHelper成功,最后会自动合并入cacheList.list
     * 
     * 主要是当前render与effect的间隙,如果renderHelper存在,则promise中通过renderHelper更新,否则重新创建一个
     * 如果render后会继续render,会有影响吗?也不会再在rendr中使用这个newCacheList
     */
    renderHelper?: ArrayHelper<ExitModelInner<V>>
  },
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

  exitIgnore = defaultToGetTrue(exitIgnore) || alawaysFalse
  enterIgnore = defaultToGetTrue(enterIgnore) || alawaysFalse

  const newCacheList = new ArrayHelper(cacheList.list)
  cacheList.renderHelper = newCacheList

  const thisAddList: ExitModelInner<V>[] = []
  const thisRemoveList: ExitModelInner<V>[] = []


  function buildRemove(old: ExitModelInner<V>) {
    const [promise, resolve] = getOutResolvePromise()
    old.promise = promise
    old.resolve = resolve
    old.step = 'exiting'
    promise.then(function () {
      //是删除,不考虑needMerge
      const eCacheList = (cacheList.renderHelper || new ArrayHelper(cacheList.list))
      const removeWhere = (x: ExitModelInner<V>) => x.key == old.key
      const n = eCacheList.removeWhere(removeWhere)
      if (n) {
        // console.log("remove", n, nv)
        cacheList.list = eCacheList.get()
        updateVersion()
      }
    })
  }

  function opHelperExiting(eCacheList: NoInsertArrayHelper<ExitModelInner<V>>, thisRemoveList: ExitModelInner<V>[]) {
    let n = 0
    eCacheList.forEach(function (cache, x) {
      if (cache.step == 'will-exiting') {
        const row = thisRemoveList.find(v => v.key == cache.key)
        if (row) {
          cache = {
            ...cache
          }
          buildRemove(cache)
          eCacheList.replace(x, cache)
          n++
        }
      }
    })
    return n
  }
  newCacheList.forEachRight(function (old, i) {
    if (!isExitingItem(old) && !list.some(v => getKey(v) == old.originalKey)) {
      //新删除了
      if (exitIgnore(old.value)) {
        newCacheList.removeAt(i)
      } else {
        const cache: ExitModelInner<V> = {
          ...old,
          step: "will-exiting"
        }
        newCacheList.replace(i, cache)
        thisRemoveList.push(cache)
      }
    }
  })
  let nextIndex = 0
  const addStep = wait == 'out-in' && thisRemoveList.length ? 'will-enter' : 'enter'
  for (let i = 0, len = list.length; i < len; i++) {
    const v = list[i]
    const key = getKey(v)
    const oldIndex = newCacheList.get().findIndex(old => !isExitingItem(old) && old.originalKey == key)
    if (oldIndex < 0) {
      if (mode == 'shift') {
        let item: ExitModelInner<V>
        while ((item = newCacheList.get()[nextIndex]) && isExitingItem(item)) {
          nextIndex++
        }
      }
      const [promise, resolve] = getOutResolvePromise()
      const cache: ExitModelInner<V> = {
        key: getNextId(promise),
        value: v,
        originalKey: key,
        step: addStep,
        enterIgnore: enterIgnore(v),
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
    thisRemoveList.forEach(buildRemove)
  }
  /**
   * useRef,不应该在render中设置值,官方这样说的
   * useEffect在Strict.Mode会执行两次,所以最好严格修改
   * 在render中创建的promise,当然可能会回滚掉,但是也不会生效.
   */
  // cacheList.current = newCacheList.get() as ExitModel<V>[]
  const tempCacheList = new ArrayHelper(newCacheList.get())
  tempCacheList.forEachRight(hideAsShowAndRemoteHide)
  return {
    list: tempCacheList.get() as readonly ExitModel<V>[],
    effect() {
      const removePromiseList: Promise<any>[] = thisRemoveList.map(v => v.promise)
      if (thisRemoveList.length) {
        const allDestroyPromise = Promise.all(removePromiseList)
        if (onExitComplete) {
          allDestroyPromise.then(onExitComplete)
        }
        const onExitWait = wait == 'out-in' && thisAddList.length != 0
        if (onExitWait) {
          allDestroyPromise.then(function () {
            //将本次更新全部标记为展示.
            //需要考虑needMerge
            const eCacheList = (cacheList.renderHelper || new ArrayHelper(cacheList.list))
            const n = opHelperEnter(eCacheList, thisAddList)
            if (n) {
              // console.log("update out-in", n, nv)
              cacheList.list = eCacheList.get()
              updateVersion()
            }
          })
        }
      }
      const addPromiseList: Promise<any>[] = []
      for (let i = 0, len = thisAddList.length; i < len; i++) {
        const thisAdd = thisAddList[i]
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
            const eCacheList = (cacheList.renderHelper || new ArrayHelper(cacheList.list))
            const n = opHelperExiting(eCacheList, thisRemoveList)
            if (n) {
              cacheList.list = eCacheList.get()
              updateVersion()
            }
          })
        }
      }
      if (onAnimateComplete && (addPromiseList.length || removePromiseList.length)) {
        Promise.all([...addPromiseList, ...removePromiseList]).then(onAnimateComplete)
      }

      cacheList.list = cacheList.renderHelper!.get()
      cacheList.renderHelper = undefined
    }
  }
}

function opHelperEnter<V>(eCacheList: NoInsertArrayHelper<ExitModelInner<V>>, thisRemoveList: ExitModelInner<V>[]) {
  let n = 0
  eCacheList.forEach(function (cache, x) {
    if (cache.step == 'will-enter') {
      const row = thisRemoveList.find(v => v.key == cache.key)
      if (row) {
        eCacheList.replace(x, {
          ...cache,
          step: "enter"
        })
        n++
      }
    }
  })
  return n
}

function hideAsShowAndRemoteHide<T>(v: ExitModelInner<T>, i: number, array: ArrayHelper<ExitModelInner<T>>) {
  if (v.step == 'will-enter') {
    array.removeAt(i)
  }
}