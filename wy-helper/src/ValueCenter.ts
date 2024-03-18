import { EmptyFun, alawaysTrue, emptyFun, run } from "./util"

type EventHandler<T> = (v: T) => void
export interface VirtualEventCenter<T> {
  subscribe(notify: EventHandler<T>): EmptyFun
}
export class EventCenter<T>{
  private pool = new Set<EventHandler<T>>()
  poolSize() {
    return this.pool.size
  }
  subscribe(notify: EventHandler<T>): EmptyFun {
    if (this.pool.has(notify)) {
      return emptyFun
    }
    this.pool.add(notify)
    const that = this
    return function () {
      that.pool.delete(notify)
    }
  }
  notify(v: T) {
    this.pool.forEach(notify => notify(v))
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

export interface ReadValueCenter<T> extends VirtualEventCenter<T> {
  get(): T
}
export interface ValueCenter<T> extends ReadValueCenter<T> {
  set(v: T): void
  poolSize(): number
}

export class ReadValueCenterProxyImpl<T> implements ReadValueCenter<T>{
  constructor(
    private center: ValueCenter<T>
  ) { }
  get(): T {
    return this.center.get()
  }
  subscribe(ev: EventHandler<T>) {
    return this.center.subscribe(ev)
  }
}
export class ValueCenterDefaultImpl<T> implements ValueCenter<T>{
  constructor(
    private value: T
  ) { }
  private ec = new EventCenter<T>()
  set(v: T): void {
    this.value = v
    this.ec.notify(v)
  }
  poolSize(): number {
    return this.ec.poolSize()
  }
  get(): T {
    return this.value
  }
  subscribe(ev: EventHandler<T>) {
    return this.ec.subscribe(ev)
  }

  private rv: ReadValueCenter<T> | undefined = undefined
  readonly() {
    if (!this.rv) {
      this.rv = new ReadValueCenterProxyImpl(this)
    }
    return this.rv
  }
}


export function valueCenterOf<T>(value: T) {
  return new ValueCenterDefaultImpl(value)
}
export function syncMergeCenter<T>(c: ReadValueCenter<T>, cb: EventHandler<T>) {
  cb(c.get())
  return c.subscribe(cb)
}


// 定义将元素类型映射成另一种类型的映射函数
type MapTo<T> = { [K in keyof T]: ValueCenter<T[K]> };
type ExtractValues<T> = {
  -readonly [K in keyof T]: T[K] extends ReadValueCenter<infer U> ? U : never;
};
function baseCenterArray<VS extends readonly ReadValueCenter<any>[]>(vs: any, list: VS, cb: EventHandler<ExtractValues<VS>>, delay = run) {
  function callback() {
    cb(vs)
  }
  const destroys = list.map((row, i) => {
    vs[i] = row.get()
    return row.subscribe(function (c) {
      vs[i] = c
      delay(callback)
    })
  })
  return function () {
    destroys.forEach(run)
  }
}
export function subscribeCenterArray<VS extends readonly ReadValueCenter<any>[]>(list: VS, cb: EventHandler<ExtractValues<VS>>, delay = run) {
  const vs = [] as any
  return baseCenterArray(vs, list, cb, delay)
}

export function syncMergeCenterArray<VS extends readonly ReadValueCenter<any>[]>(list: VS, cb: EventHandler<ExtractValues<VS>>, delay = run) {
  const vs = [] as unknown as any
  const destroy = baseCenterArray(vs, list, cb, delay)
  cb(vs)
  return destroy
}
/**
 * 事实上可以用于多种状态机
 * @param reducer 
 * @param init 
 * @returns 
 */
export function createReduceValueCenter<T, A>(
  reducer: (v: T, a: A) => T,
  init: T,
  shouldChange: (a: T, b: T) => any = alawaysTrue
) {
  const center = valueCenterOf(init)
  return [center.readonly(), function (action: A) {
    const oldValue = center.get()
    const newValue = reducer(oldValue, action)
    if (shouldChange(newValue, oldValue)) {
      center.set(newValue)
    }
    return newValue
  }] as const
}