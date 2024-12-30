import { GetValue } from "../setStateHelper"

export interface LayoutModel {
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
  getExt(): Record<string, any>
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