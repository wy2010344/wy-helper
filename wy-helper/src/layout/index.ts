import { PointKey } from "../geometry"
import { GetValue } from "../setStateHelper"
import { asLazy } from "../util"
export * from './simpleFlex'
export * from './layoutNode'
export type SizeKey = "width" | "height"

export type LayoutKey = SizeKey | PointKey

export const absoluteDisplay: MDisplayOut<any> = {
  getChildInfo(x, i) {
    throw 'no child location ' + x
  },
  getSizeInfo(x, def) {
    if (def) {
      return 0
    }
    throw 'no default value for' + x
  },
}

export type MDisplayOut<K extends string> = {
  /**
   * 
   * @param x 
   * @param def 父节点也没有值,退回自己提供的默认值,以尽量避免抛出错误 
   */
  getSizeInfo(x: K, def?: boolean): number
  /**
   * 有可能影响子节点的尺寸
   * @param x 
   * @param size 是否是尺寸
   * @param i 
   */
  getChildInfo(x: K, size: boolean, i: number): number
}

export type InstanceCallbackOrValue<T> = number | ((n: T) => number)
export function valueInstOrGetToGet<T, M, N, N1>(
  o: InstanceCallbackOrValue<M> | undefined,
  getIns: GetValue<M>,
  create: (getIns: GetValue<M>, x: N, y: N1) => GetValue<T>,
  x: N,
  y: N1
): GetValue<T> {
  const tp = typeof o
  if (tp == 'function') {
    return () => {
      return (o as any)(getIns())
    }
  } else if (tp == 'undefined') {
    return create(getIns, x, y)
  } else {
    return asLazy(o as T)
  }
}
