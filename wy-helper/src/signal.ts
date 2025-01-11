import { Compare, simpleNotEqual } from "./equal";
import { GetValue, SetValue } from "./setStateHelper";
import { StoreRef } from "./storeRef";
import { asLazy, emptyFun, EmptyFun, emptyObject, iterableToList, messageChannelCallback, numberSortAsc, run } from "./util";


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
  signals: Set<Signal<any>>
  listeners: Set<EmptyFun>
  effects: Map<number, EmptyFun[]>
}

const signalCache = m[DepKey] as {
  currentFun?: EmptyFun
  currentBatch?: CurrentBatch
  //在更新期间,放置effects
  currentEffects?: Map<number, EmptyFun[]>
  recycleBatches: CurrentBatch[]
  currentRelay?: Map<GetValue<any>, any>
  realTimeCall?: boolean
}

/**
 * 在memo里执行
 * 方便构造时新建立观察
 * @param fun 
 */
export function memoKeep(fun: EmptyFun) {
  const oldCurrent = signalCache.currentFun //在memo时存在
  const oldCurrentRelay = signalCache.currentRelay //在memo时存在
  signalCache.currentFun = undefined
  signalCache.currentRelay = undefined
  fun()
  signalCache.currentFun = oldCurrent
  signalCache.currentRelay = oldCurrentRelay
}

export function addEffect(effect: EmptyFun, level = 0) {
  let effects: Map<number, EmptyFun[]>
  if (signalCache.currentEffects) {
    effects = signalCache.currentEffects
  } else {
    beginCurrentBatch()
    effects = signalCache.currentBatch!.effects
  }
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


class Signal<T> {
  constructor(
    private value: T,
    public shouldChange: Compare<T>
  ) {
    this.dirtyValue = value
  }
  getValue() {
    if (this.dirty) {
      return this.dirtyValue
    }
    return this.value
  }
  private dirty = false
  private dirtyValue: T
  set(v: T) {
    // if (!this.dirty && !this.listeners[0].size) {
    //   console.log("没有监听者,可以安全更新", this.dirty)
    //   this.value = v
    //   return
    // }
    /**
     * 是否可以在批量结束时,才检查哪些需要改变?
     * 但是要区分缓存值与生效值
     * 场景应该很少
    */
    if (this.dirty) {
      this.dirtyValue = v
    } else if (this.shouldChange(this.value, v)) {
      this.dirty = true
      this.dirtyValue = v
      beginCurrentBatch()
      signalCache.currentBatch!.signals.add(this)
    }
  }

  acceptChange(v: T) {
    if (this.dirty) {
      return true
    }
    return this.shouldChange(this.value, v)
  }

  private listeners = [new Set<EmptyFun>(), new Set<EmptyFun>()]  //可以回收使用吧
  commit() {
    this.dirty = false
    if (this.shouldChange(this.dirtyValue, this.value)) {
      this.value = this.dirtyValue
      //组装到batch里面
      const oldListener = this.listeners.shift()!
      oldListener.forEach(addListener)
      oldListener.clear()
      this.listeners.push(oldListener)
    }
  }
  get = () => {
    const value = this.getValue()
    addRelay(this.get, value)
    if (signalCache.currentFun) {
      this.listeners[0].add(signalCache.currentFun)
    }
    return value
  }
}

/**
 * 信号
 * @param value 
 * @param shouldChange 
 * @returns 
 */
export function createSignal<T>(value: T, shouldChange: Compare<T> = simpleNotEqual): StoreRef<T> {
  const signal = new Signal(value, shouldChange)
  return {
    get: signal.get,
    set(newValue) {
      if (signalCache.currentFun) {
        throw '计算期间不允许修改值'
      }
      if (signalCache.currentEffects) {
        throw '计算期间不允许修改值1'
      }
      signal.set(newValue)
    }
  }
}

export function signalOnUpdate() {
  return Boolean(signalCache.currentEffects)
}
function beginCurrentBatch() {
  if (!signalCache.currentBatch) {
    signalCache.currentBatch = signalCache.recycleBatches.shift() || {
      listeners: new Set(),
      effects: new Map(),
      signals: new Set()
    }
    messageChannelCallback(batchSignalEnd)
  }
}
export interface SyncFun<T> {
  (set: SetValue<T>): EmptyFun;
  <A>(set: (t: T, a: A) => void, a: A): EmptyFun;
  <A, B>(set: (t: T, a: A, b: B) => void, a: A, b: B): EmptyFun;
  <A, B, C>(set: (t: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun;
}


function commitSignal(signal: Signal<any>) {
  signal.commit()
}

export function setSignalRealTime() {
  signalCache.realTimeCall = true
}
export function batchSignalEnd() {
  if (signalCache.currentEffects) {
    console.warn("更新期间重复更新")
    return
  }
  signalCache.realTimeCall = false
  const currentBatch = signalCache.currentBatch
  if (currentBatch) {
    currentBatch.signals.forEach(commitSignal)
    currentBatch.signals.clear()

    signalCache.currentBatch = undefined
    signalCache.currentEffects = currentBatch.effects

    const listeners = currentBatch.listeners
    listeners.forEach(run)
    listeners.clear()
    signalCache.currentEffects = undefined

    const effects = currentBatch.effects
    const keys = iterableToList(effects.keys()).sort(numberSortAsc)
    for (const key of keys) {
      effects.get(key)?.forEach(run)
    }
    effects.clear()

    signalCache.recycleBatches.push(currentBatch)

    if (signalCache.realTimeCall) {
      batchSignalEnd()
    }
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
export function trackSignal<T>(get: GetValue<T>, set?: SetValue<T>): EmptyFun
export function trackSignal<T, A>(get: GetValue<T>, set: (v: T, a: A) => void, a: A): EmptyFun
export function trackSignal<T, A, B>(get: GetValue<T>, set: (v: T, a: A, b: B) => void, a: A, b: B): EmptyFun
export function trackSignal<T, A, B, C>(get: GetValue<T>, set: (v: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun
export function trackSignal(get: any, set: any = emptyFun): EmptyFun {
  let disabled = false
  const a = arguments[2]
  const b = arguments[3]
  const c = arguments[4]

  let inited = false
  let lastValue: any = undefined
  function addFun() {
    if (disabled) {
      return
    }
    signalCache.currentFun = addFun
    const value = get()
    signalCache.currentFun = undefined
    if (inited) {
      if (value != lastValue) {
        lastValue = value
        set(value, a, b, c)
      }
    } else {
      inited = true
      lastValue = value
      set(value, a, b, c)
    }
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
function memoGet<T>(relays: Map<GetValue<any>, any>, get: GetValue<T>, lastValue: T, init: boolean) {
  relays.clear()
  const last = signalCache.currentRelay
  signalCache.currentRelay = relays
  const v = get(lastValue, init)
  signalCache.currentRelay = last
  return v
}

interface MemoGet<T> {
  (old: undefined, inited: false): T,
  (old: T, inited: true): T
}
export function memo<T>(
  get: MemoGet<T>,
  after: SetValue<T> = emptyFun
) {
  const relays = new Map<GetValue<any>, any>()
  let lastValue!: T
  let inited = false
  const myGet = function () {
    if (inited) {
      if (relayChange(relays)) {
        const value = memoGet(relays, get, lastValue, inited)
        if (value != lastValue) {
          lastValue = value
        }
        after(lastValue)
      }
    } else {
      lastValue = memoGet(relays, get, lastValue, inited)
      inited = true
      after(lastValue)
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
export function valueOrGetToGet<T>(o: ValueOrGet<T>): GetValue<T> {
  if (typeof o == 'function') {
    return o as any
  } else {
    return asLazy(o)
  }
}





export function toProxySignal<T extends {}>(init: T, {
  signalObject = {} as any,
  getToCreate,
  setToCreate
}: {
  signalObject?: {
    [key in keyof T]: StoreRef<T[key]>
  }
  getToCreate?: boolean
  setToCreate?: boolean
} = emptyObject) {
  for (const key in init) {
    signalObject[key] = createSignal(init[key])
  }
  type Target = Record<string | symbol, StoreRef<any>>
  return new Proxy(signalObject, {
    get(target: Target, p, receiver) {
      let tp = target[p]
      if (!tp) {
        if (getToCreate) {
          tp = createSignal(undefined)
          target[p] = tp
        } else {
          return undefined
        }
      }
      return tp.get()
    },
    set(target, p, newValue, receiver) {
      let tp = target[p]
      if (!tp) {
        if (setToCreate) {
          tp = createSignal(newValue)
          target[p] = tp
        } else {
          return false
        }
      }
      tp.set(newValue)
      return true
    },
  }) as T
}