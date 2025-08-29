import { GetValue } from '../setStateHelper'

export type LayoutModel<K extends string> = {
  index(): number
  /**为flex的伸缩 */
  getGrow(): number | void
  /**为父节点布局提供自身的尺寸 */
  getOuterSizeForParentLayout(key: K): number
  /**作为flex/stack的伸缩 */
  getAlign(key: K): AlignSelfFun | void
}

export type AlignSelfFun = {
  position(pWidth: number, getSelfWidth: GetValue<number>): number
  size(pWidth: number): number
}

export interface HookInfo<K extends string> {
  forEach(callback: (k: K) => void): void
  /**作为父节点可供布局的尺寸 */
  getInnerSizeToLayout(key: K): number
  children: GetValue<LayoutModel<K>[]>
}

const m = globalThis as unknown as {
  _wy_current_layout_children_: HookInfo<any>
}
export function hookLayout<T>(info: HookInfo<any>, calculate: GetValue<T>) {
  const before = m._wy_current_layout_children_
  m._wy_current_layout_children_ = info
  const out = calculate(info)
  m._wy_current_layout_children_ = before
  return out
}
export function hookGetLayoutChildren() {
  return m._wy_current_layout_children_
}
