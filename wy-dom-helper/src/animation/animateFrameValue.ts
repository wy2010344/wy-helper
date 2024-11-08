import { createAnimateFrameReducer, superSubscribeRequestAnimationFrame, createRecycleScrollListReducer, AnimationFrameArg, AnimateFrameValue, SetValue } from "wy-helper"
import { requestBatchAnimationFrame } from "../util"


export function subscribeRequestAnimationFrame(
  callback: (time: number, arg: AnimationFrameArg) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}

export function animateFrame(value: number, requestAnimateFrame: SetValue<SetValue<number>> = requestBatchAnimationFrame) {
  return new AnimateFrameValue(value, requestAnimateFrame)
}
export const animateFrameReducer = createAnimateFrameReducer(requestBatchAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)