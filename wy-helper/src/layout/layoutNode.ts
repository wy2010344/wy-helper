import {
  AlignSelfFun,
  emptyFun,
  EmptyFun,
  GetValue,
  hookLayout,
  InstanceCallbackOrValue,
  LayoutModel,
  MDisplayOut,
  memo,
  valueInstOrGetToGet,
  ValueOrGet,
  valueOrGetToGet,
  absoluteDisplay,
  objectMap,
  SetValue,
  HookInfo,
} from '..'

export function layoutNodeGetTarget<M, K extends string>(
  n: LayoutNode<M, K>
): M {
  return n.target
}

/**
 * 不太对.矩形区域本质上相当于g、group只管布局.在布局之下,有默认的视图?
 * 即布局本身确实需要依附一个节点存在
 */
export class LayoutNode<M, K extends string> implements LayoutModel<K> {
  target!: M
  _index: number = 0
  _get: EmptyFun = emptyFun
  index() {
    this._get()
    return this._index
  }
  constructor(
    private readonly getDisplay: GetValue<MDisplayOut<K>>,
    readonly axis: Record<
      K,
      {
        /**外部尺寸,外部也会使用 */
        size: GetValue<number>
        /**外部坐标,主要是供外部使用 */
        position: GetValue<number>
        paddingStart: GetValue<number>
        paddingEnd: GetValue<number>
        /**内部尺寸,用于自身布局,也在文字绘制时使用 */
        innerSize: GetValue<number>
        alignSelf?: AlignSelfFun
      }
    >,
    readonly children: GetValue<readonly LayoutNode<M, K>[]>,
    readonly getNotInLayout: GetValue<boolean>,
    readonly getGrow: GetValue<number | void>
  ) {}

  /**通过布局获得的信息 */
  getOuterSizeFromLayout(x: K, def?: boolean): number {
    /**布局,从子节点汇总而来 */
    const v = this.getDisplay().getSizeInfo(x, def)
    const av = this.axis[x]
    return v + av.paddingStart() + av.paddingEnd()
  }
  getChildInfo(x: K, size: boolean, i: number): number {
    const v = this.getDisplay().getChildInfo(x, size, i)
    if (size) {
      return v
    }
    const av = this.axis[x]
    return v + av.paddingStart()
  }

  /**为作为flex提供的子节点 */
  getOuterSizeForParentLayout(x: K): number {
    const av = this.axis[x]
    return av.size()
  }
  getAlign(key: K): AlignSelfFun | void {
    return this.axis[key].alignSelf
  }
}

export interface LayoutNodeConfigure<M, K extends string> {
  layout?: ((v: LayoutNode<M, K>) => MDisplayOut<K>) | MDisplayOut<K>
  axis: Record<
    K,
    {
      position?: InstanceCallbackOrValue<LayoutNode<M, K>>
      size?: InstanceCallbackOrValue<LayoutNode<M, K>>
      paddingStart?: ValueOrGet<number>
      paddingEnd?: ValueOrGet<number>
      alignSelf?: AlignSelfFun
    }
  >
  grow?: ValueOrGet<number>
  notInLayout?: ValueOrGet<boolean>
}

export type LayoutConfig<M, K extends string> = {
  getParentLayout(m: M): LayoutNode<M, K> | void
  getChildren(m: M): readonly M[]
  getLayout(m: M): LayoutNode<M, K> | void
}

function getFromParent<M, K extends string>(
  ins: LayoutNode<M, K>,
  c: LayoutConfig<M, K>,
  x: K,
  size: boolean,
  err: any = undefined,
  def = 0
) {
  const parent = c.getParentLayout(ins.target)
  if (parent && parent instanceof LayoutNode) {
    return parent.getChildInfo(x, size, ins.index())
  }
  if (err) {
    //其次选择来自父元素的约束
    throw err
  }
  return def
}

export function createLayoutNode<M, K extends string>(
  c: LayoutConfig<M, K>,
  n: LayoutNodeConfigure<M, K>
) {
  function getIns(): LayoutNode<M, K> {
    return node
  }
  const _layout = valueOrGetToGet(n.layout || absoluteDisplay)

  const axis = objectMap(n.axis, function (v, key) {
    const paddingStart = valueOrGetToGet(v.paddingStart || 0)
    const paddingEnd = valueOrGetToGet(v.paddingEnd || 0)
    const defSize = valueInstOrGetToGet<number, LayoutNode<M, K>>(
      v.size,
      getIns
    )
    return {
      alignSelf: v.alignSelf,
      size:
        defSize ||
        function (): number {
          try {
            //优先从子节点的布局获取
            const ix = node.getOuterSizeFromLayout(key)
            return ix
          } catch (err) {
            try {
              //从父节点的布局获取
              return getFromParent(
                node,
                c,
                key,
                true,
                err || `can't get size from layout`
              )
            } catch (err) {
              //采用默认值
              return node.getOuterSizeFromLayout(key, true)
            }
          }
        },
      position:
        valueInstOrGetToGet<number, LayoutNode<M, K>>(v.position, getIns) ||
        function (): number {
          //从父节点的布局获取,或者默认0
          return getFromParent(node, c, key, false)
        },
      paddingStart,
      paddingEnd,
      //内部尺寸,需要优先自身,再父布局,再子撑开
      innerSize: defSize
        ? function (): number {
            return defSize() - paddingStart() - paddingEnd()
          }
        : function (): number {
            const pw = getFromParent<M, K>(node, c, key, true, 'notfound')
            return pw - paddingStart() - paddingEnd()
          },
    }
  })

  const children = memo(() => {
    //生成复合结构,所以用memo
    const list: LayoutNode<M, K>[] = []
    c.getChildren(node.target).forEach((child, i) => {
      const rect = c.getLayout(child) as LayoutNode<M, K>
      if (rect instanceof LayoutNode && !rect.getNotInLayout()) {
        rect._index = list.length
        rect._get = children
        list.push(rect)
      }
    })
    return list
  })
  const info: HookInfo<K> = {
    forEach(callback: SetValue<K>) {
      for (const key in axis) {
        callback(key)
      }
    },
    getInnerSizeToLayout(n: K) {
      return axis[n].innerSize()
    },
    children,
  }
  const layout: GetValue<MDisplayOut<K>> = memo(() => {
    //生成复全结构,所以用memo
    return hookLayout(info, _layout)
  })
  const node = new LayoutNode<M, K>(
    layout,
    axis,
    children,
    valueOrGetToGet(n.notInLayout || false),
    valueOrGetToGet(n.grow)
  )
  return node
}
