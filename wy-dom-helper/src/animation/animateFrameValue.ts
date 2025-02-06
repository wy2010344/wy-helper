import { createAnimateFrameReducer, superSubscribeRequestAnimationFrame, createRecycleScrollListReducer, AnimationFrameArg, AnimateFrameValue, SetValue, SignalAnimateFrameValue, EmptyFun } from "wy-helper"
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

export function signalAnimateFrame(value: number,
  requestAnimateFrame: SetValue<SetValue<number>> = requestBatchAnimationFrame,
  eachCommit?: EmptyFun
) {
  return new SignalAnimateFrameValue(value, requestAnimateFrame, eachCommit)
}

export const animateFrameReducer = createAnimateFrameReducer(requestBatchAnimationFrame)

export const recycleScrollListReducer = createRecycleScrollListReducer(animateFrameReducer)