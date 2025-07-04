import { GetValue } from "./setStateHelper";
import { createSignal } from "./signal";



export function createVersion(step = Number.MIN_VALUE) {
  const v = createSignal(Number.MIN_SAFE_INTEGER)

  return {
    get: v.get,
    update() {
      const n = v.get() + step
      if (n >= Number.MAX_SAFE_INTEGER) {
        console.error('出现错误,到达最大边界')
      }
      v.set(n)
    }
  }
}



export function optimistic<T>(get: GetValue<T>) {
  const cache = createSignal<{ value: T } | undefined>(undefined)
  return {
    get() {
      const c = cache.get()
      if (c) {
        return c.value
      }
      return get()
    },
    set(v: T) {
      cache.set({
        value: v
      })
    },
    loading() {
      return Boolean(cache.get())
    },
    reset() {
      cache.set(undefined)
    }
  }
}