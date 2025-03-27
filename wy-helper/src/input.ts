import { simpleNotEqual } from "./equal"
import { SetValue } from "./setStateHelper"
import { quote } from "./util"

export interface StoreTransform<T, V> {
  toComponentValue(n: T): V
  /**throw处理不能解读 */
  fromComponent(n: V, setValue: SetValue<T>): void
  shouldChange(a: T, b: V): boolean
}


export const numberStoreTranfrom = {
  toComponentValue(n: any) {
    return n + ''
  },
  fromComponent(n: any, setValue: SetValue<number>) {
    const x = Number(n)
    if (isNaN(x)) {
      return
    }
    setValue(x)
  },
  shouldChange(a: number, b: any) {
    return a != Number(b)
  },
}

export const anyStoreTransform = {
  toComponentValue: quote,
  fromComponent<T>(n: T, setValue: SetValue<T>) {
    setValue(n)
  },
  shouldChange: simpleNotEqual
}