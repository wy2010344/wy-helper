import { AnimateFrameValue, animateFrameReducer, superSubscribeRequestAnimationFrame } from "wy-helper"


export function subscribeRequestAnimationFrame(
  callback: (time: number, isInit: boolean) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}



export function animateNumberFrame(value: number, requestAnimateFrame = requestAnimationFrame) {
  return new AnimateFrameValue(value, requestAnimateFrame)
}
export const animateNumberFrameReducer = animateFrameReducer(requestAnimationFrame)

