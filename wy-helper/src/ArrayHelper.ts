

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
  forEach(fun: (v: V, i: number) => void) {
    for (let i = 0; i < this.array.length; i++) {
      fun(this.array[i], i)
    }
  }
  forEachRight(fun: (v: V, i: number) => void) {
    for (let i = this.array.length - 1; i > -1; i--) {
      fun(this.array[i], i)
    }
  }
  removeWhere(fun: (v: V, i: number) => any) {
    let count = 0
    for (let i = this.array.length - 1; i > -1; i--) {
      const row = this.array[i]
      if (fun(row, i)) {
        count++
        this.removeAt(i)
      }
    }
    return count
  }
}
