import { LayoutKey } from "."
import { GetValue } from "../setStateHelper"
import { ValueOrGet } from "../signal"

export type LayoutModel<K extends string> = {
  getSize(key: K): number
  getPosition(key: K): number
  index(): number
  getGrow(): number | void
  getAlign(key: K): AlignSelfFun | void
  // getExt(): {
  //   /**
  //    * 这个应该在提供flex的地方过滤
  //    * 便需要外部提供key
  //    */
  //   // notFlex?: boolean,
  //   grow?: ValueOrGet<number>
  //   align?: Partial<Record<K, AlignSelfFun>>
  // }
}

export type AlignSelfFun = {
  position(pWidth: number, getSelfWidth: GetValue<number>): number
  size(pWidth: number): number
}


export interface HookInfo<K extends string> {
  getSize(key: K): number
  children: GetValue<LayoutModel<K>[]>
}

const m = globalThis as unknown as {
  _wy_current_layout_children_: HookInfo<any>
}
export function hookLayout<T>(
  info: HookInfo<any>,
  calculate: GetValue<T>
) {
  const before = m._wy_current_layout_children_
  m._wy_current_layout_children_ = info
  const out = calculate(info)
  m._wy_current_layout_children_ = before
  return out
}
export function hookGetLayoutChildren() {
  return m._wy_current_layout_children_
}