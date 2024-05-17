import { AnimateFrameValueImpl, createAnimateFrameReducer, superSubscribeRequestAnimationFrame, createRecycleScrollListReducer } from "wy-helper"


export function subscribeRequestAnimationFrame(
  callback: (time: number, isInit: boolean) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}

export function animateFrame(value: number, requestAnimateFrame = requestAnimationFrame) {
  return new AnimateFrameValueImpl(value, requestAnimateFrame)
}
export const animateFrameReducer = createAnimateFrameReducer(requestAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)