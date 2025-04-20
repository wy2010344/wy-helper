import { GetValue } from "../setStateHelper"

export type LayoutModel<K extends string> = {
  index(): number
  getGrow(): number | void


  getSize(key: K): number
  getPosition(key: K): number
  getAlign(key: K): AlignSelfFun | void
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