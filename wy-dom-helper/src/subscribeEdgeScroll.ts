import { Axis, EdgeScrollConfig, PointKey, edgeScrollChange, emptyObject } from "wy-helper"
import { subscribeAnimationFrame } from "./animation"



export function subscribeEdgeScroll(get: () => {
  point: number
  direction: PointKey,
  container: HTMLElement,
  config: EdgeScrollConfig,
  arg?: {
    disabled?: boolean
    scrollDiffLeft?(d: number): void
    scrollDiffTop?(d: number): void
  }
} | void) {
  return subscribeAnimationFrame(function () {
    const v = get()
    if (!v) {
      return
    }
    const { point, direction, config, container, arg } = v
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
    edgeScrollChange(point, axis, config, function (diff) {
      if (direction == 'x') {
        container.scrollLeft += diff
        arg?.scrollDiffLeft?.(diff)
      } else {
        container.scrollTop += diff
        arg?.scrollDiffTop?.(diff)
      }
    })
  })
}