import { AlignSelfFun, emptyFun, EmptyFun, GetValue, hookLayout, InstanceCallbackOrValue, LayoutModel, MDisplayOut, memo, valueInstOrGetToGet, ValueOrGet, valueOrGetToGet, absoluteDisplay, objectMap, alignSelf } from ".."

export function layoutNodeGetTarget<M, K extends string>(n: LayoutNode<M, K>): M {
  return n.target
}


/**
 * 不太对.矩形区域本质上相当于g、group只管布局.在布局之下,有默认的视图?
 * 即布局本身确实需要依附一个节点存在
 */
export class LayoutNode<M, K extends string> implements MDisplayOut<K>, LayoutModel<K> {
  target!: M
  _index: number = 0
  _get: EmptyFun = emptyFun
  index() {
    this._get()
    return this._index
  }
  constructor(
    readonly getDisplay: GetValue<MDisplayOut<K>>,
    readonly axis: Record<K, {
      position: GetValue<any>;
      size: GetValue<any>;
      paddingStart: GetValue<number>;
      paddingEnd: GetValue<number>;
      drawSize: GetValue<number>;
      alignSelf?: AlignSelfFun
    }>,
    readonly children: GetValue<readonly LayoutNode<M, K>[]>,
    readonly getNotInLayout: GetValue<boolean>,
    readonly getGrow: GetValue<number | void>,
  ) { }

  /**通过布局获得的信息 */
  getSizeInfo(x: K, def?: boolean): number {
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

  /**为作为flex提供的节点 */
  getSize(x: K): number {
    const av = this.axis[x]
    return av.size()
  }
  getAlign(key: K): AlignSelfFun | void {
    return this.axis[key].alignSelf
  }
  getPosition(x: K): number {
    const av = this.axis[x]
    return av.position()
  }
}

export interface LayoutNodeConfigure<M, K extends string> {
  layout?: ((v: LayoutNode<M, K>) => MDisplayOut<K>) | MDisplayOut<K>
  axis: Record<K, {
    position?: InstanceCallbackOrValue<LayoutNode<M, K>>,
    size?: InstanceCallbackOrValue<LayoutNode<M, K>>,
    paddingStart?: ValueOrGet<number>
    paddingEnd?: ValueOrGet<number>
    alignSelf?: AlignSelfFun
  }>
  grow?: ValueOrGet<number>
  notInLayout?: ValueOrGet<boolean>
}

export type LayoutConfig<M, K extends string> = {
  getParentLayout(m: M): LayoutNode<M, K> | void
  getChildren(m: M): readonly M[]
  getLayout(m: M): LayoutNode<M, K> | void
}
/**
 * 没有显式定义的时候,如何取值.
 * @param x 
 * @param size 
 * @returns 
 */
function superCreateGet<M, K extends string>(size: boolean) {
  return function (getIns: GetValue<LayoutNode<M, K>>, x: K, c: LayoutConfig<M, K>) {
    return function () {
      const ins = getIns()
      if (size) {
        try {
          //优先选择自己的,
          const ix = ins.getSizeInfo(x)
          return ix
        } catch (err) {
          try {
            return getFromParent(ins, c, x, size, err)
          } catch (err) {
            return ins.getSizeInfo(x, true)
          }
        }
      } else {
        try {
          return getFromParent(ins, c, x, size, 'define')
        } catch (err) {
          return 0
        }
      }
    }
  }
}

function getFromParent<M, K extends string>(
  ins: LayoutNode<M, K>,
  c: LayoutConfig<M, K>,
  x: K,
  size: boolean,
  err: any) {
  if (ins.getNotInLayout()) {
    throw err
  }
  const parent = c.getParentLayout(ins.target)
  if (parent && parent instanceof LayoutNode) {
    return parent.getChildInfo(x, size, ins.index())
  }
  //其次选择来自父元素的约束
  throw err
}

const createGetPosition = superCreateGet(false)
const createGetSize = superCreateGet(true)

function emptyThrow(): number {
  throw 'abc'
}

function getInnerSize<M, K extends string>(
  o: InstanceCallbackOrValue<LayoutNode<M, K>> | undefined,
  c: LayoutConfig<M, K>,
  getIns: GetValue<LayoutNode<M, K>>,
  key: K,
  begin: GetValue<number>,
  end: GetValue<number>
): GetValue<number> {
  const tp = typeof o
  if (tp == 'undefined') {
    return function () {
      return getFromParent(getIns(), c, key, true, '') - begin() - end()
    }
  } else if (tp == 'number') {
    return function () {
      return (o as number) - begin() - end()
    }
  } else if (tp == 'function') {
    return function () {
      return (o as any)(getIns()) - begin() - end()
    }
  } else {
    return emptyThrow
  }
}
export function createLayoutNode<M, K extends string>(
  c: LayoutConfig<M, K>,
  n: LayoutNodeConfigure<M, K>,
) {
  function getIns(): LayoutNode<M, K> {
    return node
  }
  const _layout = valueOrGetToGet(n.layout || absoluteDisplay)

  const axis = objectMap(n.axis, function (v, key) {
    const size = valueInstOrGetToGet(v.size, getIns, createGetSize, key, c)
    const paddingStart = valueOrGetToGet(v.paddingStart || 0)
    const paddingEnd = valueOrGetToGet(v.paddingEnd || 0)
    return {
      alignSelf: v.alignSelf,
      position: valueInstOrGetToGet(v.position, getIns, createGetPosition, key, c),
      size,
      paddingStart,
      paddingEnd,
      drawSize: getInnerSize(
        v.size,
        c,
        getIns,
        key,
        paddingStart,
        paddingEnd)
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
  const info = {
    keys: Object.keys(axis),
    getSize(n: K) {
      return axis[n].drawSize()
    },
    children
  }
  const layout: GetValue<MDisplayOut<K>> = memo(() => {
    //生成复全结构,所以用memo
    return hookLayout(info, _layout)
  })
  const node = new LayoutNode<M, K>(
    layout,
    axis,
    info.children,
    valueOrGetToGet(n.notInLayout || false),
    valueOrGetToGet(n.grow),
  )
  return node
}