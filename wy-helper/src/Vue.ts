import { EmptyFun } from "./util"
const m = globalThis as any
const DepKey = 'wy-helper-dep-cache'
if (!m[DepKey]) {
  class Dep {
    static uid = 0
    id = Dep.uid++
    static target: Watcher | null
    static watcherCount = 0
    subs: { [key: number]: Watcher } = {}
    depend() {
      if (Dep.target) {
        this.subs[Dep.target.id] = Dep.target
      }
    }
    notify() {
      const oldSubs = this.subs
      this.subs = {}
      for (const key in oldSubs) {
        oldSubs[key].update()
      }
    }
  }
  m[DepKey] = Dep
}
const Dep = m[DepKey]
export type ShouldChange<T> = (a: T, b: T) => any
/**
 * 必须默认true，因为引用类似修改无法通过相等判断
 * @param a 
 * @param b 
 * @returns 
 */
export const alawaysChange: ShouldChange<any> = function (a, b) {
  return true
}
/**
 * 不相同的时候
 * @param a 
 * @param b 
 * @returns 
 */
export const notEqualChange: ShouldChange<any> = function (a, b) {
  return a != b
}
/**存储器 */
export interface Value<T> {
  (v: T): void
  (): T
}
/**新存储器*/
export function valueOf<T>(v: T, shouldChange = alawaysChange): Value<T> {
  const dep = new Dep()
  return function () {
    if (arguments.length == 0) {
      dep.depend()
      return v
    } else {
      if (Dep.target) {
        throw "计算期间不允许修改"
      } else {
        const nv = arguments[0]
        if (shouldChange(v, nv)) {
          v = nv
          dep.notify()
        }
      }
    }
  } as any
}
/**
 * 原子的值类型
 * @param v 
 * @param shouldChange 
 * @returns 
 */
export function atomValueOf<T>(v: T, shouldChange = notEqualChange): Value<T> {
  return valueOf(v, shouldChange)
}
interface LifeModel {
  Watch(exp: () => void): void
  WatchExp<A, B>(before: () => A, exp: (a: A) => B, after: (b: B) => void): void
  WatchBefore<A>(before: () => A, exp: (a: A) => void): void
  WatchAfter<B>(exp: () => B, after: (b: B) => void): void
  Cache<T>(fun: () => T, shouldChange?: ShouldChange<T>): () => T
  AtomCache<T>(fun: () => T, shouldChange?: ShouldChange<T>): () => T
  destroyList: (() => void)[]
}



export function cacheOf<T>(fun: () => T, shouldChange: ShouldChange<T> = alawaysChange) {
  const dep = new Dep()
  let cache: T
  const destroy = watch(function () {
    const nv = fun()
    if (shouldChange(cache, nv)) {
      cache = nv
      dep.notify()
    }
  })
  return [function () {
    dep.depend()
    return cache
  }, destroy] as const
}

export function atomCacheOf<T>(fun: () => T, shouldChange: ShouldChange<T> = notEqualChange) {
  return cacheOf(fun, shouldChange)
}
class Watcher {
  constructor(
    private realUpdate: (it: Watcher) => void
  ) {
    Dep.watcherCount++
    this.update()
    this.disable = this.disable.bind(this)
  }
  static uid = 0
  id = Watcher.uid++
  private enable = true
  update() {
    if (this.enable) {
      this.realUpdate(this)
    }
  }
  disable() {
    this.enable = false
    Dep.watcherCount--
  }
}

export function watch(exp: () => void) {
  return new Watcher(function (it) {
    Dep.target = it
    exp()
    Dep.target = null
  }).disable
}
export function watchExp<A, B>(before: () => A, exp: (a: A) => B, after: (b: B) => void) {
  return new Watcher(function (it) {
    const a = before()
    Dep.target = it
    const b = exp(a)
    Dep.target = null
    after(b)
  }).disable
}
export function watchBefore<A>(before: () => A, exp: (a: A) => void) {
  return new Watcher(function (it) {
    const a = before()
    Dep.target = it
    exp(a)
    Dep.target = null
  }).disable
}
export function watchAfter<B>(exp: () => B, after: (b: B) => void) {
  return new Watcher(function (it) {
    Dep.target = it
    const b = exp()
    Dep.target = null
    after(b)
  }).disable
}