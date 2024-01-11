import { EmptyFun, emptyFun, quote } from "./util"

type EventHandler<T> = (v: T) => void
export interface VirtualEventCenter<T> {
  subscribe(notify: EventHandler<T>): () => void
}
export type Subscriber<T> = (v: EventHandler<T>) => (() => void)
export function eventCenter<T>() {
  const pool = new Set<EventHandler<T>>()
  return {
    poolSize() {
      return pool.size
    },
    subscribe(notify: EventHandler<T>): EmptyFun {
      if (pool.has(notify)) {
        return emptyFun
      }
      pool.add(notify)
      return function () {
        pool.delete(notify)
      }
    },
    notify(v: T) {
      pool.forEach(notify => notify(v))
    }
  }
}
export function toReduceState<T>(set: (v: T) => void, get: () => T,) {
  return function (v: T | ((prev: T) => T)) {
    if (typeof (v) == 'function') {
      set((v as any)(get()))
    } else {
      set(v)
    }
  }
}
export interface ValueCenter<T> {
  get(): T
  set(v: T): void
  poolSize(): number
  subscribe: Subscriber<T>
}
export function valueCenterOf<T>(value: T): ValueCenter<T> {
  const { subscribe, notify, poolSize } = eventCenter<T>()
  return {
    get() {
      return value
    },
    poolSize,
    set(v) {
      value = v
      notify(v)
    },
    subscribe
  }
}

export function subSubscriber<P, C>(subscribe: Subscriber<P>, filter: (p: P) => C, notify: EventHandler<C>) {
  let lastValue: C | undefined
  return subscribe(function (p) {
    const value = filter(p)
    if (value != lastValue) {
      lastValue = value
      notify(value)
    }
  })
}