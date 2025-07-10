import { Axis, EdgeScrollConfig, PointKey, edgeScrollChange } from "wy-helper"
import { subscribeRequestAnimationFrame } from "./animation"


export type MoveEdgeScrollProps = {
  point: number,
  direction: PointKey,
  config?: EdgeScrollConfig,
  scrollDiff?(d: number): void
  multi?: number
}
const defConfig: EdgeScrollConfig = {
  padding: 10,
  config: true
}
/**
 * 鼠标移动到滚动区域外,滚动到此外
 * 如果是mouseMove事件触发,只在触发时生效
 * 所以要动画检测
 * @param point 光标位置,pageX或pageY
 * @param v 
 */
export function moveEdgeScroll(container: HTMLElement, {
  point,
  direction,
  config = defConfig,
  scrollDiff,
  multi = 1
}: MoveEdgeScrollProps) {
  const rect = container.getBoundingClientRect()
  let axis: Axis
  if (direction == 'x') {
    axis = {
      min: rect.left,
      max: rect.right
    }
  } else {
    axis = {
      min: rect.top,
      max: rect.bottom
    }
  }
  const update = edgeScrollChange(axis, config, function (diff) {
    if (direction == 'x') {
      container.scrollLeft += diff * multi
      scrollDiff?.(diff)
    } else {
      container.scrollTop += diff * multi
      scrollDiff?.(diff)
    }
  })
  update(point)
  return {
    changePoint(n: number) {
      point = n
    },
    destroy: subscribeRequestAnimationFrame(() => {
      update(point)
    })
  }
}