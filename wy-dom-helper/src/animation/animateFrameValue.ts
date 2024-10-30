import { createAnimateFrameReducer, superSubscribeRequestAnimationFrame, createRecycleScrollListReducer, AnimationFrameArg, AnimateFrameValue } from "wy-helper"


export function subscribeRequestAnimationFrame(
  callback: (time: number, arg: AnimationFrameArg) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}

export function animateFrame(value: number, requestAnimateFrame = globalThis.requestAnimationFrame) {
  return new AnimateFrameValue(value, requestAnimateFrame)
}
export const animateFrameReducer = createAnimateFrameReducer(globalThis.requestAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)