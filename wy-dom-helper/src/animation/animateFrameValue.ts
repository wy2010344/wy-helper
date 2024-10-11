import { AnimateFrameValueImpl, createAnimateFrameReducer, superSubscribeRequestAnimationFrame, createRecycleScrollListReducer } from "wy-helper"


export function subscribeRequestAnimationFrame(
  callback: (time: number, isInit: boolean) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}

export function animateFrame(value: number, requestAnimateFrame = globalThis.requestAnimationFrame) {
  return new AnimateFrameValueImpl(value, requestAnimateFrame)
}
export const animateFrameReducer = createAnimateFrameReducer(globalThis.requestAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)