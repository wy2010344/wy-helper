import { LayoutKey } from "."
import { GetValue } from "../setStateHelper"
import { ValueOrGet } from "../signal"

export interface LayoutModel {
  index(): number
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
  getExt(): {
    /**
     * 这个应该在提供flex的地方过滤
     * 便需要外部提供key
     */
    // notFlex?: boolean,
    grow?: ValueOrGet<number>
    align?: AlignSelfFun
  }
}

export type AlignSelfFun = {
  position(pWidth: number, getSelfWidth: GetValue<number>): number
  size(pWidth: number): number
}


export interface HookInfo {
  width: GetValue<number>
  height: GetValue<number>
  children: GetValue<LayoutModel[]>
}

const m = globalThis as unknown as {
  _wy_current_layout_children_: HookInfo
}
export function hookLayout<T>(
  info: HookInfo,
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