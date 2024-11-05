import { Compare, simpleNotEqual } from "./equal";
import { GetValue, SetValue } from "./setStateHelper";
import { StoreRef } from "./storeRef";
import { EmptyFun, iterableToList, messageChannelCallback, run } from "./util";


const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'
if (!m[DepKey]) {
  m[DepKey] = {
    cacheBatchListener: new Set(),
    effects: new Map()
  }
}

const signalCache = m[DepKey] as {
  currentFun?: EmptyFun | undefined,
  batchListeners?: Set<EmptyFun>
  onUpdate?: boolean
  cacheBatchListener: Set<EmptyFun>
  onBatch?: boolean
  currentRelay?: Map<GetValue<any>, any>
  effects: Map<number, EmptyFun[]>
}

export function addEffect(effect: EmptyFun, level = 0) {
  let olds = signalCache.effects.get(level)
  if (!olds) {
    olds = []
    signalCache.effects.set(level, olds)
  }
  olds.push(effect)
}

function addRelay(get: GetValue<any>, value: any) {
  signalCache.currentRelay?.set(get, value)
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
export function createSignal<T>(value: T, shouldChange: Compare<T> = simpleNotEqual): StoreRef<T> {
  let listeners = [new Set<EmptyFun>(), new Set<EmptyFun>()]  //可以回收使用吧

  function get() {
    addRelay(get, value)
    if (signalCache.currentFun) {
      listeners[0].add(signalCache.currentFun)
    }
    return value
  }
  return {
    get,
    set(newValue) {
      if (signalCache.currentFun) {
        throw '计算期间不允许修改值'
      }
      if (shouldChange(newValue, value)) {
        value = newValue
        const oldListener = listeners.shift()!
        if (!signalCache.batchListeners) {
          batchSignalBegin()
          messageChannelCallback(batchSignalEnd)
        }
        oldListener.forEach(addListener)
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


function batchSignalBegin() {
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
    signalCache.onBatch = undefined
    const effects = signalCache.effects
    const keys = iterableToList(effects.keys()).sort()
    for (const key of keys) {
      effects.get(key)?.forEach(run)
    }
    effects.clear()
  } else {
    console.log("未在批量任务中,没必要更新")
  }
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



function relayChange(relays: Map<GetValue<any>, any>) {
  for (const [get, old] of relays) {
    const v = get()
    if (v != old) {
      return true
    }
  }
  return false
}
function memoGet<T>(relays: Map<GetValue<any>, any>, get: GetValue<T>) {
  relays.clear()
  const last = signalCache.currentRelay
  signalCache.currentRelay = relays
  const v = get()
  signalCache.currentRelay = last
  return v
}
export function memo<T>(
  get: GetValue<T>,
  shouldChange: Compare<T> = simpleNotEqual
) {
  const relays = new Map<GetValue<any>, any>()
  let lastValue!: T
  let init = false
  const myGet = function () {
    if (init) {
      if (relayChange(relays)) {
        const value = memoGet(relays, get)
        if (shouldChange(value, lastValue)) {
          lastValue = value
        }
      }
    } else {
      lastValue = memoGet(relays, get)
      init = true
    }
    addRelay(myGet, lastValue)
    return lastValue
  }
  return myGet
}

