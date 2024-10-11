import { AnimateFrameValueImpl, createAnimateFrameReducer, createSubscribeAnimationFrame, createRecycleScrollListReducer } from "wy-helper"


export const subscribeAnimationFrame = createSubscribeAnimationFrame(
  globalThis.requestAnimationFrame,
  globalThis.cancelAnimationFrame
)

export function animateFrame(value: number, _subscribeAnimationFrame = subscribeAnimationFrame) {
  return new AnimateFrameValueImpl(value, _subscribeAnimationFrame)
}
export const animateFrameReducer = createAnimateFrameReducer(globalThis.requestAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)