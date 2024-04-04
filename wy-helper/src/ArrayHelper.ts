import { ReadArray, emptyArray, objectFreeze } from "./util"


export class ArrayHelper<V>{
  private dirty = false
  private array: V[]
  constructor(
    _array: readonly V[]
  ) {
    this.array = _array as V[]
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
export const emptyArrayHelper = objectFreeze(new ArrayHelper(emptyArray)) as NoInsertArrayHelper<any>


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

export function arrayToMove<T>(list: T[], startIndex: number, endIndex: number) {
  'worklet';
  list = list.slice()
  const [item] = list.splice(startIndex, 1)
  list.splice(endIndex, 0, item)
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