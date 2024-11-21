import { Compare, simpleNotEqual } from "./equal";
import { GetValue, SetValue } from "./setStateHelper";
import { StoreRef } from "./storeRef";
import { asLazy, EmptyFun, iterableToList, messageChannelCallback, run } from "./util";


const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'
if (!m[DepKey]) {
  m[DepKey] = {
    batchListeners: new Set(),
    effects: new Map(),
    recycleBatches: []
  }
}


type CurrentBatch = {
  listeners: Set<EmptyFun>
  effects: Map<number, EmptyFun[]>
}

const signalCache = m[DepKey] as {
  currentFun?: EmptyFun | undefined,
  currentBatch?: CurrentBatch
  recycleBatches: CurrentBatch[]
  onUpdate?: boolean
  currentRelay?: Map<GetValue<any>, any>
}

export function addEffect(effect: EmptyFun, level = 0) {
  beginCurrentBatch()
  const effects = signalCache.currentBatch!.effects
  let olds = effects.get(level)
  if (!olds) {
    olds = []
    effects.set(level, olds)
  }
  olds.push(effect)
}

function addRelay(get: GetValue<any>, value: any) {
  signalCache.currentRelay?.set(get, value)
}
function addListener(listener: EmptyFun) {
  signalCache.currentBatch!.listeners.add(listener)
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
        beginCurrentBatch()
        //组装到batch里面
        const oldListener = listeners.shift()!
        oldListener.forEach(addListener)
        oldListener.clear()
        listeners.push(oldListener)
      }
    },
  }
}

function beginCurrentBatch() {
  if (!signalCache.currentBatch) {
    signalCache.currentBatch = signalCache.recycleBatches.shift() || {
      listeners: new Set(),
      effects: new Map()
    }
    messageChannelCallback(batchSignalEnd)
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
export function batchSignalEnd() {
  const currentBatch = signalCache.currentBatch
  if (currentBatch) {
    signalCache.currentBatch = undefined
    checkUpdate()

    const listeners = currentBatch.listeners
    listeners.forEach(run)
    signalCache.onUpdate = undefined
    listeners.clear()

    const effects = currentBatch.effects
    const keys = iterableToList(effects.keys()).sort()
    for (const key of keys) {
      effects.get(key)?.forEach(run)
    }
    effects.clear()

    signalCache.recycleBatches.push(currentBatch)
    if (signalCache.recycleBatches.length > 2) {
      console.log("出现多个recycleBatches", signalCache.recycleBatches.length)
    }
  } else {
    // console.log("未在批量任务中,没必要更新")
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



export type ValueOrGet<T> = T | GetValue<T>
export function getValueOrGet<T>(o: ValueOrGet<T>) {
  if (typeof o == 'function') {
    return (o as GetValue<T>)()
  } else {
    return o
  }
}
/**
 * 转化成信号
 * @param o 
 * @param toMemo 
 * @param shouldChange 
 * @returns 
 */
export function valueOrGetToGet<T>(o: ValueOrGet<T>, toMemo?: boolean, shouldChange?: Compare<T>): GetValue<T> {
  if (typeof o == 'function') {
    if (toMemo) {
      return memo(o as any, shouldChange)
    }
    return o as any
  } else {
    return asLazy(o)
  }
}