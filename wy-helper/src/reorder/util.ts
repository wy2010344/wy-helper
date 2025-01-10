import { emptyObject } from "../util";


/**
 * 
 * 这个不是中线相交发生替换,而是移动距离大于目标元素的一半
 * 实时的靠速度来判断
 * @param order 
 * @param index 当前元素所在坐标 
 * @param getOffsetHeight 
 * @param offset 拖拽偏移量
 * @param speed 速度决定判断的方向
 * @returns 
 */
export function reorderCheckTarget<T>(
  order: readonly T[],
  index: number,
  getOffsetHeight: (n: T, i: number) => number,
  offset: number,
  gap = 0,
  /**
   * start-self:开始的一半,不应该存在,
   *  因为silentDiff是target的offsetHeight+gap,否则会有闪烁
   *  这里offset>gap+target.offsetHeight/2,则一diff,则仍然是正(符号不变)
   * start-target:结束的一半,刚刚好的位置
   * center:两个中线相交,各自的一半
   * end-self:与自身的结束位置相交,全部的开始+一半的结束
   * end-target:与目标的结束位置相交,一半开始+全部的结束
   */
  // meetAt?: "start-target" | "center" | "end-self" | "end-target",
  /**
   * 使用meetDiff,可以更多控制
   * 中线,startheight/2
   * @param startHeight 
   * @param endHeight 
   * @param gap 
   */
  meetDiff?: (startHeight: number, endHeight: number, gap: number) => number
) {
  'worklet';
  gap = Math.abs(gap)
  //速度为0时,不调整
  if (!offset) {
    return
  }
  const nextOffset = offset > 0 ? 1 : -1
  let nextHeightOffset = gap * nextOffset
  const startHeight = getOffsetHeight(order[index], index)
  let flagIndex = index
  while (flagIndex > -1 && flagIndex < order.length) {
    const nextIndex = flagIndex + nextOffset
    const nextItem = order[nextIndex]
    if (!nextItem) {
      break
    }
    const nextHeight = getOffsetHeight(nextItem, nextIndex)
    let meetDiffValue = meetDiff?.(startHeight, nextHeight, gap) || 0
    if (meetDiffValue < 0) {
      console.warn("差异值必须为正")
      meetDiffValue = -meetDiffValue
    }
    let nextHeightCenter = nextHeight / 2 + meetDiffValue
    if (
      (nextOffset > 0 && offset > nextHeightOffset + nextHeightCenter) ||
      (nextOffset < 0 && offset < nextHeightOffset - nextHeightCenter)
    ) {
      flagIndex = nextIndex
      nextHeightOffset += ((nextHeight + gap) * nextOffset)
    } else {
      break
    }
  }
  if (flagIndex != index) {
    return [index, flagIndex] as const
  }
}

/**
 * 从位置1变化到位置2
 */
export type MoveIndex = readonly [number, number]

/**
 * 这两个概念太复杂了,
 * 在引用的地方,还是使用区分来处理
 * @param idx 
 * @param idx1 
 * @param callback 
 */
export function rangeBetweenLeft(idx: number, idx1: number, callback: (i: number) => void) {
  if (idx < idx1) {
    for (let i = idx; i < idx1; i++) {
      callback(i)
    }
  } else {
    for (let i = idx; i > idx1; i--) {
      callback(i)
    }
  }
}
export function rangeBetweenRight(idx: number, idx1: number, callback: (i: number) => void) {
  if (idx < idx1) {
    for (let i = idx; i < idx1; i++) {
      callback(i + 1)
    }
  } else {
    for (let i = idx; i > idx1; i--) {
      callback(i - 1)
    }
  }
}


/**
 * 未调整顺序前的数组,如何处理
 * @param fromIndex 当前元素的位置
 * @param toIndex 当前元素的目标位置
 * @param outList 外部列表
 * @param getOffsetHeight 如何获得每个元素的高度
 * @param gap 元素的间距
 * @param layoutFrom 受影响的元素如何表演布局动画
 * @returns 返回当前元素需要silentDiff的多少
 */
export function beforeMoveOperate<T>(
  fromIndex: number,
  toIndex: number,
  outList: readonly T[],
  getOffsetHeight: (n: T, i: number) => number,
  gap: number,
  layoutFrom: (row: T, from: number, i: number) => void
) {
  const div = outList[fromIndex]
  const offsetHeight = getOffsetHeight(div, fromIndex)
  if (toIndex < fromIndex) {
    //向前移动
    let diff = 0
    for (let i = toIndex; i < fromIndex; i++) {
      const row = outList[i]
      diff = diff + getOffsetHeight(outList[i], i) + gap
      layoutFrom(row, -offsetHeight - gap, i)
    }
    return diff
  } else {
    //向后移动

    let diff = 0
    for (let i = fromIndex + 1; i < toIndex + 1; i++) {
      //受影响的表演一次animation动画
      const row = outList[i]
      diff = diff + getOffsetHeight(outList[i], i) + gap
      layoutFrom(row, offsetHeight + gap, i)
    }
    return -diff
  }
}