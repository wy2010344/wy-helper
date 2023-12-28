
export type StoreRef<T> = {
  set(v: T): void
  get(): T
}
class StoreRefImpl<T> implements StoreRef<T>{
  constructor(
    private value: T
  ) { }
  get() {
    return this.value
  }
  set(v: T): void {
    this.value = v
  }
}
export function storeRef<T>(value: T, ...vs: any[]) {
  return new StoreRefImpl(value) as StoreRef<T>
}