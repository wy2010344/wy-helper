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
export type ShouldChange<T> = (a: T, b: T) => boolean
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
class LifeModelImpl implements LifeModel {
  AtomCache<T>(fun: () => T, shouldChange: ShouldChange<T> = notEqualChange): () => T {
    return this.Cache(fun, shouldChange)
  }
  Cache<T>(fun: () => T, shouldChange: ShouldChange<T> = alawaysChange): () => T {
    const dep = new Dep()
    let cache: T
    this.Watch(function () {
      const nv = fun()
      if (shouldChange(cache, nv)) {
        cache = nv
        dep.notify()
      }
    })
    return function () {
      dep.depend()
      return cache
    }
  }
  WatchAfter<B>(exp: () => B, after: (b: B) => void): void {
    this.pool.push(Watcher.ofAfter(exp, after))
  }
  WatchBefore<A>(before: () => A, exp: (a: A) => void): void {
    this.pool.push(Watcher.ofBefore(before, exp))
  }
  WatchExp<A, B>(before: () => A, exp: (a: A) => B, after: (b: B) => void): void {
    this.pool.push(Watcher.ofExp(before, exp, after))
  }
  Watch(exp: () => void): void {
    this.pool.push(Watcher.of(exp))
  }
  destroyList: (() => void)[] = []
  private pool: Watcher[] = []
  destroy() {
    while (this.pool.length > 0) {
      this.pool.pop()!.disable()
    }
    for (let destroy of this.destroyList) {
      destroy()
    }
  }
}
export function newLifeModel(): {
  me: LifeModel,
  destroy(): void
} {
  const lm = new LifeModelImpl()
  return {
    me: lm,
    destroy() {
      lm.destroy()
    }
  }
}
export type LifeModelReturn = ReturnType<typeof newLifeModel>
class Watcher {
  private constructor(
    private realUpdate: (it: Watcher) => void
  ) {
    Dep.watcherCount++
    this.update()
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

  static of(exp: () => void) {
    return new Watcher(function (it) {
      Dep.target = it
      exp()
      Dep.target = null
    })
  }
  static ofExp<A, B>(before: () => A, exp: (a: A) => B, after: (b: B) => void) {
    return new Watcher(function (it) {
      const a = before()
      Dep.target = it
      const b = exp(a)
      Dep.target = null
      after(b)
    })
  }
  static ofBefore<A, B>(before: () => A, exp: (a: A) => void) {
    return new Watcher(function (it) {
      const a = before()
      Dep.target = it
      exp(a)
      Dep.target = null
    })
  }
  static ofAfter<B>(exp: () => B, after: (b: B) => void) {
    return new Watcher(function (it) {
      Dep.target = it
      const b = exp()
      Dep.target = null
      after(b)
    })
  }
}