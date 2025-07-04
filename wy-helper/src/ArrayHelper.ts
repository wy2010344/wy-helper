import { SetValue } from "./setStateHelper"
import { numberBetween, ReadArray } from "./util"


/**
 * @todo 对Array/Map/Set
 * 有个helper,当然加工过程
 * 但是如果是删除移动项,重新构造一份数据是难免的.
 * 在react/mve中,事实上需要无副作用,因为可能旧数据还在生效.
 */
export class ArrayHelper<V> {
  private dirty = false
  private array: V[]
  constructor(
    _array: readonly V[]
  ) {
    this.array = _array as V[]
  }
  reset(v: readonly V[]) {
    this.array = v as V[]
    this.dirty = false
  }
  get(): readonly V[] {
    return this.array
  }
  private safeCopy() {
    if (!this.dirty) {
      this.dirty = true
      this.array = this.array.slice()
    }
  }
  isDirty() {
    return this.dirty
  }
  insert(n: number, v: V) {
    this.safeCopy()
    this.array.splice(n, 0, v)
  }
  removeAt(n: number) {
    this.safeCopy()
    this.array.splice(n, 1)
  }
  replace(n: number, v: V) {
    this.safeCopy()
    this.array[n] = v
  }
  forEach(fun: (v: V, i: number, self: ArrayHelper<V>) => void) {
    for (let i = 0; i < this.array.length; i++) {
      fun(this.array[i], i, this)
    }
  }
  forEachRight(fun: (v: V, i: number, self: ArrayHelper<V>) => void) {
    for (let i = this.array.length - 1; i > -1; i--) {
      fun(this.array[i], i, this)
    }
  }
  /**
   * 就是forEachRight的一个简化
   * @param fun 
   * @returns 
   */
  removeWhere(fun: (v: V, i: number, self: ArrayHelper<V>) => any) {
    let count = 0
    for (let i = this.array.length - 1; i > -1; i--) {
      const row = this.array[i]
      if (fun(row, i, this)) {
        count++
        this.removeAt(i)
      }
    }
    return count
  }
}

export type NoInsertArrayHelper<T> = Omit<ArrayHelper<T>, 'insert'>

export function arrayFindIndexFrom<T>(
  vs: ReadArray<T>,
  from: number,
  predict: (row: T, i: number, t: ReadArray<T>) => any,
  end = vs.length) {
  const theEnd = Math.min(end, vs.length)
  for (let i = from; i < theEnd; i++) {
    if (predict(vs[i], i, vs)) {
      return i
    }
  }
  return -1
}



export function arrayFindFrom<T>(
  vs: ReadArray<T>,
  from: number,
  predict: (row: T, i: number, t: ReadArray<T>) => any,
  end = vs.length) {
  const index = arrayFindIndexFrom(vs, from, predict, end)
  if (index < 0) {
    return
  }
  return vs[index]
}

export function arrayMove<T>(list: T[], fromIndex: number, toIndex: number, clone?: boolean) {
  'worklet';
  if (clone) {
    list = list.slice()
  }
  const [item] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, item)
  return list
}


export function arrayCountCreateWith<T>(n: number, create: (i: number) => T) {
  const list: T[] = []
  for (let i = 0; i < n; i++) {
    list.push(create(i))
  }
  return list
}



export function arrayPush<T>(vs: T[], ...vs1: T[]) {
  return arrayPushAll(vs, vs1)
}
export function arrayPushAll<T>(vs: T[], vs1: T[]) {
  for (let i = 0; i < vs1.length; i++) {
    vs.push(vs1[i])
  }
  return vs
}
export function arrayUnshiftAll<T>(vs: T[], vs1: T[]) {
  for (let i = vs.length - 1; i > -1; i--) {
    vs1.unshift(vs[i])
  }
  return vs1
}


export function arrayFunToOneOrEmpty<T extends (...vs: any[]) => void>(list: (T | undefined)[]): T | undefined {
  if (list.length == 1) {
    return list[0]
  } else if (list.length) {
    return function (...vs) {
      list.forEach(row => row?.(...vs))
    } as T
  }
}

export function arrayFunRun<T extends (...vs: any[]) => void>(list: (T | undefined)[], ...vs: Parameters<T>) {
  list.forEach(row => {
    row?.(...vs)
  })
}


export function splitList<T>(ids: T[], limit: number, callback: SetValue<T[]>) {
  const nLimit = numberBetween(1, Math.round(limit), Infinity)
  if (nLimit != limit) {
    console.log(`分割数${limit}不对,已经恢复成${nLimit}`)
  }
  if (ids.length <= nLimit) {
    callback(ids)
    return
  }
  let list: T[] = []
  ids.forEach(function (id) {
    list.push(id)
    if (list.length == nLimit) {
      callback(list)
      list = []
    }
  })
  if (list.length) {
    callback(list)
  }
}