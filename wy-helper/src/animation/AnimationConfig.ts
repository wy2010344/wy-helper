import { EaseFn } from "../scroller"
import { FalseType, emptyObject } from "../util"
import { SpringBaseArg, springBase, springIsStop } from "./spring"




export interface AnimationConfig {
  /**
   * 位移
   * 是否结束
   */
  (diffTime: number): [number, boolean]
}


export interface GetDeltaXAnimationConfig {
  (deltaX: number): AnimationConfig | FalseType
}

export function combineAnimationConfig(
  before: AnimationConfig,
  duration: number,
  after: AnimationConfig
): AnimationConfig {
  return function (diffTime) {
    const dx = diffTime - duration
    if (dx > 0) {
      return after(dx)
    }
    return [before(diffTime)[0], false]
  }
}

export function tweenAnimationConfig(
  deltaX: number,
  duration: number,
  fn: EaseFn,
): AnimationConfig {
  return function (diffTime) {
    const pc = diffTime / duration
    if (pc < 1) {
      return [deltaX * fn(pc), false]
    } else {
      return [deltaX, true]
    }
  }
}
export function getTweenAnimationConfig(
  duration: number,
  fn: EaseFn
): GetDeltaXAnimationConfig {
  return function (deltaX) {
    return tweenAnimationConfig(deltaX, duration, fn)
  }
}


export type SpringBaseAnimationConfigArg = {
  config?: SpringBaseArg
  /**初始速度 v0 (可选) */
  initialVelocity?: number
  displacementThreshold?: number,
  velocityThreshold?: number
}

export function springBaseAnimationConfig(deltaX: number, {
  config,
  initialVelocity = 0,
  displacementThreshold = 0.01,
  velocityThreshold = 2
}: SpringBaseAnimationConfigArg = emptyObject): AnimationConfig {
  return function (diffTime) {
    const out = springBase(diffTime / 1000, deltaX, initialVelocity, config)
    const stop = springIsStop(out, displacementThreshold, velocityThreshold)
    if (stop) {
      return [deltaX, true]
    } else {
      return [deltaX - out.displacement, false]
    }
  }
}
export function getSpringBaseAnimationConfig(arg?: SpringBaseAnimationConfigArg): GetDeltaXAnimationConfig {
  return function (deltaX) {
    return springBaseAnimationConfig(deltaX, arg)
  }
}