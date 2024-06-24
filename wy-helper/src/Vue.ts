import { EmptyFun, alawaysTrue } from "./util"
import { Compare, simpleNotEqual } from "./equal"
import { AskNextTimeWork, NextTimeWork, SetValue, storeRef } from "."
const m = globalThis as any
const DepKey = 'wy-helper-dep-cache'
if (!m[DepKey]) {
  class Dep {
    static uid = 0
    id = Dep.uid++
    static target: Watcher | null
    static watcherCount = 0
    subs: { [key: string]: Watcher } = {}
    depend() {
      if (Dep.target) {
        this.subs[Dep.target.id] = Dep.target
      }
    }
    notify() {
      const oldSubs = this.subs
      this.subs = {}
      for (const key in oldSubs) {
        if (!Dep.globalSubs.find(v => v.id == key)) {
          Dep.globalSubs.push(oldSubs[key])
        } else {
          console.log("不重复注入watch")
        }
      }
      Dep.globalRun()
    }


    static globalSubs: Watcher[] = []
    static globalIsRun = false
    static globalRun() {
      if (this.globalIsRun) {
        return
      }
      this.globalIsRun = true
      while (this.globalSubs) {
        const first = this.globalSubs.shift()!
        first.update()
      }
      this.globalIsRun = false
    }
  }
  m[DepKey] = Dep
}
const Dep = m[DepKey]
/**存储器 */
export interface Value<T> {
  (v: T): void
  (): T
}
/**新存储器*/
export function valueOf<T>(v: T, shouldChange: (a: T, b: T) => any = alawaysTrue): Value<T> {
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
export function atomValueOf<T>(v: T, shouldChange = simpleNotEqual): Value<T> {
  return valueOf(v, shouldChange)
}

class Watcher {
  constructor(
    private addTask: (fun: EmptyFun) => void,
    private realUpdate: (it: Watcher) => void
  ) {
    Dep.watcherCount++
    this.update()
    this.disable = this.disable.bind(this)
    this.didUpdate = this.didUpdate.bind(this)
  }
  static uid = 0
  id = "" + Watcher.uid++
  private enable = true


  private inTaskList = false
  update() {
    if (this.onWork) {
      throw new Error("update when self is on work")
    }
    if (this.inTaskList) {
      return
    }
    if (this.enable) {
      this.inTaskList = true
      this.addTask(this.didUpdate)
    }
  }

  private onWork = false
  private didUpdate() {
    if (this.enable) {
      this.onWork = true
      this.realUpdate(this)
      this.onWork = false
    }
    this.inTaskList = false
  }
  disable() {
    this.enable = false
    Dep.watcherCount--
  }
}

export function watch(addTask: SetValue<EmptyFun>, exp: () => void) {
  return new Watcher(addTask, function (it) {
    Dep.target = it
    exp()
    Dep.target = null
  }).disable
}
export function cacheOf<T>(addTask: SetValue<EmptyFun>, fun: () => T, shouldChange: Compare<T> = alawaysTrue) {
  const dep = new Dep()
  let cache: T
  const destroy = watch(addTask, function () {
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


export function watchExp<A, B>(addTask: SetValue<EmptyFun>, before: () => A, exp: (a: A) => B, after: (b: B) => void) {
  return new Watcher(addTask, function (it) {
    const a = before()
    Dep.target = it
    const b = exp(a)
    Dep.target = null
    after(b)
  }).disable
}
export function watchBefore<A>(addTask: SetValue<EmptyFun>, before: () => A, exp: (a: A) => void) {
  return new Watcher(addTask, function (it) {
    const a = before()
    Dep.target = it
    exp(a)
    Dep.target = null
  }).disable
}
export function watchAfter<B>(addTask: SetValue<EmptyFun>, exp: () => B, after: (b: B) => void) {
  return new Watcher(addTask, function (it) {
    Dep.target = it
    const b = exp()
    Dep.target = null
    after(b)
  }).disable
}

export function atomCacheOf<T>(addTask: SetValue<EmptyFun>, fun: () => T, shouldChange: Compare<T> = simpleNotEqual) {
  return cacheOf(addTask, fun, shouldChange)
}
/**
 * 如果Watch可以在react的fiber里面,添加到对应的列表里
 * 比如添加到effect的列表里
 * 添加到普通render的列表里
 * @param askNextTimeWork 
 * @returns 
 */

export function createVueInstance(
  askNextTimeWork: AskNextTimeWork,
  getMoreWork: () => void | NextTimeWork
) {
  const realTime = storeRef(false)
  const taskList: EmptyFun[] = []
  function runNextTask() {
    taskList.shift()?.()
  }
  const askWork = askNextTimeWork({
    realTime,
    askNextWork() {
      if (taskList.length) {
        return runNextTask
      }
      return getMoreWork()
    },
  })
  return function (fun: EmptyFun) {
    taskList.push(fun)
    askWork()
  }
}