import { GetValue } from "../setStateHelper"

export interface LayoutModel {
  x: GetValue<number>
  y: GetValue<number>
  width: GetValue<number>
  height: GetValue<number>
}


const m = globalThis as unknown as {
  _wy_current_layout_children_: GetValue<LayoutModel[]>
}
export function hookLayout<T>(
  getChildren: GetValue<LayoutModel[]>,
  calculate: GetValue<T>
) {
  const before = m._wy_current_layout_children_
  m._wy_current_layout_children_ = getChildren
  const out = calculate()
  m._wy_current_layout_children_ = before
  return out
}
export function hookGetLayoutChildren() {
  return m._wy_current_layout_children_
}