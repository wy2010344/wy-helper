import { Axis, EdgeScrollConfig, PointKey, edgeScrollChange } from "wy-helper"
import { subscribeRequestAnimationFrame } from "./animation"


/**
 * 鼠标移动到滚动区域外,滚动到此外
 * 如果是mouseMove事件触发,只在触发时生效
 * 所以要动画检测
 * @param point 光标位置,pageX或pageY
 * @param v 
 */
export function moveEdgeScroll(point: number, v: {
  direction: PointKey,
  container: HTMLElement,
  config: EdgeScrollConfig,
  arg?: {
    disabled?: boolean
    scrollDiffLeft?(d: number): void
    scrollDiffTop?(d: number): void
  }
}) {
  const { direction, config, container, arg } = v
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
      container.scrollLeft += diff
      arg?.scrollDiffLeft?.(diff)
    } else {
      container.scrollTop += diff
      arg?.scrollDiffTop?.(diff)
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