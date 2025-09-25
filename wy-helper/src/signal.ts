import { Compare, simpleNotEqual } from './equal'
import { GetValue, SetValue } from './setStateHelper'
import { StoreRef } from './storeRef'
import {
  asLazy,
  emptyFun,
  EmptyFun,
  emptyObject,
  iterableToList,
  messageChannelCallback,
  numberSortAsc,
  run,
} from './util'

const m = globalThis as any
const DepKey = 'wy-helper-signal-cache'

function createBatch(): CurrentBatch {
  return {
    listeners: new Set(),
    effects: new Map(),
    deps: [],
  }
}
if (!m[DepKey]) {
  let uid = Number.MIN_SAFE_INTEGER
  const o = {
    batchListeners: new Set(),
    effects: new Map(),
    currentBatch: createBatch(),
    nextBatch: createBatch(),
    state: {
      uid,
      version: uid,
    },
  }
  m[DepKey] = o
}

type CurrentBatch = {
  listeners: Set<TrackSignal<any>>
  effects: Map<number, EmptyFun[]>
  deps: TrackSignal<any>[]
}
interface Version {
  uid: number
  version: any
}
const signalCache = m[DepKey] as {
  currentFun?: TrackSignal<any>
  //为react而处理
  currentFunRemove?: boolean
  //开始了异步任务
  beginBatch?: boolean
  currentBatch: CurrentBatch
  nextBatch: CurrentBatch

  //在更新期间,放置effects
  onWorkBatch?: CurrentBatch

  currentRelay?: MapGetDep
  //在执行effect期间
  onEffectRun?: boolean
  onEffectLevel: number
  //是否在注入期间
  state: Version
  callGet?: boolean
}
function updateGlobalVersion(v: Version) {
  if (v.uid == Number.MAX_SAFE_INTEGER) {
    v.version = Symbol()
    return
  }
  v.uid = v.uid + 1
  v.version = v.uid
}

function effectsAddLevel(
  effects: Map<number, EmptyFun[]>,
  level: number,
  effect: EmptyFun
) {
  let olds = effects.get(level)
  if (!olds) {
    olds = []
    effects.set(level, olds)
  }
  olds.push(effect)
}

/**
 * 向最近的effect添加
 * @param effect
 * @param level
 */
export function addEffect(effect: EmptyFun, level = 0) {
  if (signalCache.onEffectRun && level > signalCache.onEffectLevel) {
    //可在当前区间插入
    effectsAddLevel(signalCache.nextBatch.effects, level, effect)
  } else {
    let effects: Map<number, EmptyFun[]>
    if (signalCache.onWorkBatch) {
      effects = signalCache.onWorkBatch.effects
    } else {
      beginCurrentBatch()
      effects = signalCache.currentBatch!.effects
    }
    effectsAddLevel(effects, level, effect)
  }
}

function addRelay(get: GetValue<any>, value: any) {
  const relay = signalCache.currentRelay
  if (relay) {
    relay.set(get, value)
  }
}

class Signal<T> {
  constructor(private value: T, public shouldChange: Compare<T>) {}
  set = (v: T) => {
    if (signalCache.onWorkBatch && this.listeners.length) {
      //如果在计算期间,且有依赖项,不能安全更新
      throw '计算期间不允许修改值'
    }
    if (this.shouldChange(v, this.value)) {
      if (signalCache.callGet) {
        updateGlobalVersion(signalCache.state)
        signalCache.callGet = false
      }
      this.value = v
      if (this.listeners.length) {
        //有listener才通知更新
        this.listeners.forEach(addListener)
        this.listeners.length = 0
        beginCurrentBatch()
      }
    }
    return v
  }

  private listeners: TrackSignal<any>[] = []
  get = () => {
    const value = this.value
    addRelay(this.get, value)
    if (signalCache.currentFun) {
      //只收集自己的依赖
      if (signalCache.currentFunRemove) {
        //因为react的render可能很多,所以禁止重入
        if (!this.listeners.includes(signalCache.currentFun)) {
          this.listeners.push(signalCache.currentFun)
        }
      } else {
        this.listeners.push(signalCache.currentFun)
      }
    }
    return value
  }
}

function addListener(listener: TrackSignal<any>) {
  signalCache.currentBatch.listeners.add(listener)
}

/**
 * 信号
 * @param value
 * @param shouldChange
 * @returns
 */
export function createSignal<T>(
  value: T,
  shouldChange: Compare<T> = simpleNotEqual
): StoreRef<T> {
  return new Signal(value, shouldChange)
}

export function signalOnUpdate() {
  return Boolean(signalCache.onWorkBatch)
}
function beginCurrentBatch() {
  if (!signalCache.beginBatch) {
    signalCache.beginBatch = true
    messageChannelCallback(batchSignalEnd)
  }
}

export function batchSignalEnd() {
  if (signalCache.onEffectRun) {
    console.log('执行effect中不能batchSignalEnd')
    return
  }
  if (signalCache.onWorkBatch) {
    console.log('执行listener中不能batchSignalEnd')
    return
  }

  let c = 0
  while (signalCache.beginBatch) {
    //执行观察事件,即trackSignal的两个函数参数,与上游的memo参数
    signalCache.beginBatch = false
    const currentBatch = signalCache.currentBatch
    signalCache.currentBatch = signalCache.nextBatch
    signalCache.nextBatch = currentBatch
    //交换后
    const { deps, effects, listeners } = currentBatch
    signalCache.onWorkBatch = currentBatch
    listeners.forEach(runListener)
    listeners.clear()

    while (deps.length) {
      //因为可能在执行中动态增加,所以使用这个shift的方式
      const fun = deps.shift()!
      fun.addFun()
    }
    signalCache.onWorkBatch = undefined

    ///执行effect事件
    signalCache.onEffectRun = true

    const keys = iterableToList(effects.keys()).sort(numberSortAsc)
    for (const key of keys) {
      signalCache.onEffectLevel = key
      effects.get(key)?.forEach(run)
    }
    effects.clear()
    signalCache.onEffectRun = undefined
    c++
  }
  // if (c) {
  //   console.log("render", c)
  // }
}

function runListener(o: TrackSignal<any>) {
  o.addFun()
}

export function memoFun<T extends Function>(
  get: MemoGet<T> | MemoFun<T>,
  after: SetValue<T> = emptyFun
): T {
  const value = memo(get, after) as any
  if (!value.memoFun) {
    value.memoFun = function () {
      return value().apply(null, arguments)
    } as any
  }
  return value.memoFun as any
}

export interface TrackSignalSet<T> {
  (v: T, oldV: undefined, inited: false): void | EmptyFun
  (v: T, oldV: T, inited: true): void | EmptyFun
}

class TrackSignal<T> {
  private disabled = false

  private inited = false
  private lastValue: any = undefined

  private destroy = emptyFun
  constructor(private get: MemoGet<T>, private set: TrackSignalSet<T>) {
    const deps = signalCache.onWorkBatch?.deps
    if (deps) {
      deps.push(this)
    } else {
      //没在执行中
      beginCurrentBatch()
      signalCache.currentBatch.deps.push(this)
    }
  }
  addFun() {
    if (this.disabled) {
      return
    }

    signalCache.currentFun = this
    const value = this.get(this.lastValue, this.inited as true)
    signalCache.currentFun = undefined

    if (this.inited) {
      if (value != this.lastValue) {
        this.destroy()
        this.destroy = this.set(value, this.lastValue, this.inited) || emptyFun
        this.lastValue = value
      }
    } else {
      this.destroy = this.set(value, this.lastValue, this.inited) || emptyFun
      this.lastValue = value
      this.inited = true
    }
  }
  dispose() {
    //销毁
    this.destroy()
    this.disabled = true
  }
}
/**
 * 跟踪信号
 * 这里get函数是常执行的,set函数会在必要时执行,跟memo的结果一样
 * 是否可以合并只有一个函数,则始终是memo的.毕竟现在set里,也不能设置状态了
 * 而且由于是终节点,get在批量时,每次只执行一次
 * @param get 通过信号计算出来的值
 * @returns 同步事件
 */
export function trackSignal<T>(
  get: MemoGet<T>,
  set: TrackSignalSet<T> = emptyFun
): EmptyFun {
  const t = new TrackSignal(get, set)
  return t.dispose.bind(t)
}

/**
 * 希望支持如mobx
 * @param callback 信号变化,通知更新
 * @returns
 */
export function collectSignal(callback: EmptyFun) {
  const t = new TrackSignal(callback, emptyFun)
  return {
    destroy: t.dispose.bind(t),
    /**
     * 如收集react的render
     * 这里其实就会涉及反复render,注入链表很长
     * @param fun
     * @returns
     */
    collect<T>(fun: GetValue<T>, remove?: boolean) {
      signalCache.currentFun = t
      signalCache.currentFunRemove = remove
      const value = fun()
      signalCache.currentFun = undefined
      signalCache.currentFunRemove = false
      return value
    },
  }
}

type MapGetDep = Map<GetValue<any>, any>
function relayChange(relays: MapGetDep) {
  for (const [get, old] of relays) {
    //这里负责着注入
    const v = get()
    if (v != old) {
      return true
    }
  }
  return false
}
function memoGet<T>(
  relays: MapGetDep,
  get: GetValue<T>,
  lastValue: T,
  init: boolean
) {
  relays.clear()
  signalCache.currentRelay = relays
  const v = get(lastValue, init)
  return v
}

export interface MemoGet<T> {
  (old: undefined, inited: false): T
  (old: T, inited: true): T
}

export interface MemoFun<T> {
  (): T
  memorized: true
  after?: SetValue<T>
}
function mapInject(value: any, key: GetValue<any>) {
  key()
}
export function memo<T>(get: MemoGet<T> | MemoFun<T>, after?: SetValue<T>) {
  const target = get as any
  if (target.memorized && (after == target.after || after == emptyFun)) {
    //减少不必要的声明
    return get as MemoFun<T>
  }
  const relays = new Map<GetValue<any>, any>() as MapGetDep
  let lastValue!: T
  let inited = false
  let stateVersion: any = relays
  let listenerVersion: any = undefined
  const myGet = function () {
    signalCache.callGet = true
    //每一次都不能跳过,主要是trackSignal需要流入依赖
    if (stateVersion == signalCache.state.version) {
      const currentFun = signalCache.currentFun
      if (currentFun && listenerVersion != currentFun) {
        //在依赖注入期间
        listenerVersion = currentFun
        relays.forEach(mapInject)
      }
      addRelay(myGet, lastValue)
      return lastValue
    }
    //这里一定要重置
    listenerVersion = undefined
    stateVersion = signalCache.state.version

    let shouldAfter = false
    const oldRelay = signalCache.currentRelay
    signalCache.currentRelay = undefined
    if (inited) {
      //这个relayChange,会检查上游的更新
      if (relayChange(relays)) {
        const value = memoGet(relays, get, lastValue, inited)
        if (value != lastValue) {
          lastValue = value
          shouldAfter = true
        }
      }
    } else {
      lastValue = memoGet(relays, get, lastValue, inited)
      inited = true
      shouldAfter = true
    }
    signalCache.currentRelay = oldRelay

    addRelay(myGet, lastValue)
    if (shouldAfter && after) {
      //是需要控制每次函数执行后执行,还是每次结果不同才执行?
      after(lastValue)
    }
    return lastValue
  } as MemoFun<T>
  myGet.memorized = true
  myGet.after = after
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

export function toProxySignal<T extends {}>(
  init: T,
  {
    signalObject = {} as any,
    getToCreate,
    setToCreate,
  }: {
    signalObject?: {
      [key in keyof T]: StoreRef<T[key]>
    }
    getToCreate?: boolean
    setToCreate?: boolean
  } = emptyObject
) {
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
