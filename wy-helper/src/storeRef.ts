export type StoreRef<T> = {
  set(v: T): T;
  get(): T;
};
class StoreRefImpl<T> implements StoreRef<T> {
  constructor(private value: T) {}
  get() {
    return this.value;
  }
  set(v: T): T {
    this.value = v;
    return v;
  }
}
export function storeRef<T>(value: T, ...vs: any[]) {
  return new StoreRefImpl(value) as StoreRef<T>;
}
