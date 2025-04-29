import { EmptyFun, createSubscribeRequestAnimationFrame, SubscribeRequestAnimationFrame, createAnimateSignal, createObserverAnimateSignal } from "wy-helper"
import { requestBatchAnimationFrame } from "../util"


export const subscribeRequestAnimationFrame = createSubscribeRequestAnimationFrame(
  requestBatchAnimationFrame,
  performance.now.bind(performance)
)


export function animateSignal(value: number,
  requestAnimateFrame: SubscribeRequestAnimationFrame = subscribeRequestAnimationFrame
) {
  return createAnimateSignal(value, requestAnimateFrame)
}

export const observerAnimateSignal = createObserverAnimateSignal(subscribeRequestAnimationFrame)