import { Compare, simpleNotEqual } from "./equal";
import { GetValue, SetValue } from "./setStateHelper";
import { StoreRef } from "./storeRef";
import { EmptyFun, run } from "./util";
const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'
if (!m[DepKey]) {
  m[DepKey] = {
    cacheBatchListener: new Set()
  }
}
const signalCache = m[DepKey] as {
  currentFun?: EmptyFun | undefined,
  batchListeners?: Set<EmptyFun>
  onUpdate?: boolean
  cacheBatchListener: Set<EmptyFun>
  onBatch?: boolean
}
function addListener(listener: EmptyFun) {
  signalCache.batchListeners!.add(listener)
}
/**
 * 信号
 * @param value 
 * @param shouldChange 
 * @returns 
 */
export function Signal<T>(value: T, shouldChange: Compare<T> = simpleNotEqual): StoreRef<T> {
  let listeners = [new Set<EmptyFun>(), new Set<EmptyFun>()]  //可以回收使用吧
  return {
    get() {
      if (signalCache.currentFun) {
        listeners[0].add(signalCache.currentFun)
      }
      return value
    },
    set(newValue) {
      if (signalCache.currentFun) {
        throw '计算期间不允许修改值'
      }
      if (shouldChange(newValue, value)) {
        value = newValue
        const oldListener = listeners.shift()!
        if (signalCache.batchListeners) {
          oldListener.forEach(addListener)
        } else {
          checkUpdate()
          oldListener.forEach(run)
          signalCache.onUpdate = undefined
        }
        oldListener.clear()
        listeners.push(oldListener)
      }
    },
  }
}

function checkUpdate() {
  if (signalCache.onUpdate) {
    throw "更新期间重复更新"
  }
  signalCache.onUpdate = true
}

export interface SyncFun<T> {
  (set: SetValue<T>): EmptyFun;
  <A>(set: (t: T, a: A) => void, a: A): EmptyFun;
  <A, B>(set: (t: T, a: A, b: B) => void, a: A, b: B): EmptyFun;
  <A, B, C>(set: (t: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun;
}


export function batchSignalBegin() {
  if (signalCache.onBatch) {
    throw "批量更新内不能再批量更新"
  }
  signalCache.onBatch = true
  const listeners = signalCache.cacheBatchListener//可以回收使用吧
  signalCache.batchListeners = listeners

}

export function batchSignalEnd() {
  const listeners = signalCache.batchListeners
  if (listeners) {
    signalCache.batchListeners = undefined
    checkUpdate()
    listeners.forEach(run)
    signalCache.onUpdate = undefined
    listeners.clear()
    signalCache.onBatch = false
  } else {
    console.log("未在批量任务中,没必要更新")
  }
}
/**
 * 批量
 * @param fun 
 */
export function batchSignal(set: EmptyFun): void
export function batchSignal<A>(set: (a: A) => void, a: A): void
export function batchSignal<A, B>(set: (a: A, b: B) => void, a: A, b: B): void
export function batchSignal<A, B, C>(set: (a: A, b: B, c: C) => void, a: A, b: B, c: C): void
export function batchSignal(set: any) {
  batchSignalBegin()
  const a = arguments[1]
  const b = arguments[2]
  const c = arguments[3]
  set(a, b, c)
  batchSignalEnd()
}
/**
 * 跟踪信号
 * @param get 通过信号计算出来的值
 * @returns 同步事件
 */
export function trackSignal<T>(get: GetValue<T>, set: SetValue<T>): EmptyFun
export function trackSignal<T, A>(get: GetValue<T>, set: (v: T, a: A) => void, a: A): EmptyFun
export function trackSignal<T, A, B>(get: GetValue<T>, set: (v: T, a: A, b: B) => void, a: A, b: B): EmptyFun
export function trackSignal<T, A, B, C>(get: GetValue<T>, set: (v: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun
export function trackSignal(get: any, set: any): EmptyFun {
  let disabled = false
  const a = arguments[2]
  const b = arguments[3]
  const c = arguments[4]
  function addFun() {
    if (disabled) {
      return
    }
    signalCache.currentFun = addFun
    const value = get()
    signalCache.currentFun = undefined
    set(value, a, b, c)
  }
  addFun()
  //销毁
  return function () {
    disabled = true
  }
}
/**
 * 缓存信号
 * @deprecated 不使用这种,使用幂等函数来memo
 * @param get 
 * @returns 
 */
export function cacheSignal<T>(get: GetValue<T>) {
  const signal = Signal(get())
  const destroy = trackSignal(get, signal.set)
  return [signal.get, destroy] as const
}