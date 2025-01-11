import { Compare } from "../equal"
import { PointKey } from "../geometry"
import { GetValue } from "../setStateHelper"
import { memo } from "../signal"
import { asLazy } from "../util"

export type SizeKey = "width" | "height"

export type LayoutKey = SizeKey | PointKey

export type MDisplayOut = {
  getInfo(x: LayoutKey): number
  /**
   * 有可能影响子节点的尺寸
   * @param x 
   * @param i 
   */
  getChildInfo(x: LayoutKey, i: number): number
}

export type InstanceCallbackOrValue<T> = number | ((n: T) => number)
export function valueInstOrGetToGet<T, M>(
  o: InstanceCallbackOrValue<M> | undefined,
  getIns: GetValue<M>,
  create: (getIns: GetValue<M>) => GetValue<T>
): GetValue<T> {
  const tp = typeof o
  if (tp == 'function') {
    return () => {
      return (o as any)(getIns())
    }
  } else if (tp == 'undefined') {
    return create(getIns)
  } else {
    return asLazy(o as T)
  }
}
