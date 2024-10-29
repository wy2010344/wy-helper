import { Compare, simpleNotEqual } from "./equal";
import { GetValue, SetValue } from "./setStateHelper";
import { EmptyFun, run } from "./util";
const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'
if (!m[DepKey]) {
  m[DepKey] = {}
}
const signalCache = m[DepKey] as {
  currentFun?: EmptyFun | undefined,
  batchListeners?: Set<EmptyFun>
  onUpdate?: boolean
}
function addListener(listener: EmptyFun) {
  signalCache.batchListeners!.add(listener)
}
export interface SignalValue<T> {
  (v: T): void
  (): T
}
/**
 * 信号
 * @param value 
 * @param shouldChange 
 * @returns 
 */
export function signal<T>(value: T, shouldChange: Compare<T> = simpleNotEqual): SignalValue<T> {
  let listeners = new Set<EmptyFun>()
  return function () {
    if (arguments.length == 0) {
      if (signalCache.currentFun) {
        listeners.add(signalCache.currentFun)
      }
      return value
    } else {
      const newValue = arguments[0]
      if (signalCache.currentFun) {
        throw '计算期间不允许修改值'
      }
      if (shouldChange(newValue, value)) {
        value = newValue
        const oldListener = listeners
        listeners = new Set()
        if (signalCache.batchListeners) {
          oldListener.forEach(addListener)
        } else {
          checkUpdate()
          oldListener.forEach(run)
          signalCache.onUpdate = undefined
        }
      }
    }
  } as any
}

const safeGetKey = '__SAFE_GET__'
export function safeSignalGet<T>(v: SignalValue<T>): GetValue<T> {
  const m = v as any
  if (!m[safeGetKey]) {
    m[safeGetKey] = () => v()
  }
  return m[safeGetKey]
}

function checkUpdate() {
  if (signalCache.onUpdate) {
    throw "更新期间重复更新"
  }
  signalCache.onUpdate = true
}
/**
 * 批量
 * @param fun 
 */
export function batchSignal(fun: EmptyFun) {
  const listeners = new Set<EmptyFun>()
  signalCache.batchListeners = listeners
  fun()
  signalCache.batchListeners = undefined
  checkUpdate()
  listeners.forEach(run)
  signalCache.onUpdate = undefined
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
 * @param get 
 * @returns 
 */
export function cacheSignal<T>(get: GetValue<T>) {
  const fun = signal(get())
  const destroy = trackSignal(get, fun)
  return [safeSignalGet(fun), destroy] as const
}