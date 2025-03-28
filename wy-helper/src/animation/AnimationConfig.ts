import { EaseFn } from "../scroller"
import { Quote, alawaysFalse, emptyObject } from "../util"
import { createAnimationTime } from "./animateSignal"
import { AnimateSignalConfig } from "./animateSignal"
import { SpringBaseArg, SpringOutValue, springBase, springIsStop } from "./spring"





export function tweenAnimationConfigNoEnd(
  deltaX: number,
  duration: number,
  fn: EaseFn,
  edge = Infinity
): Quote<number> {
  return function (diffTime) {
    const pc = diffTime / duration
    if (pc < edge) {
      return deltaX * fn(pc)
    }
    return deltaX
  }
}

export type DeltaXSignalAnimationConfig = (
  deltaX: number) => AnimateSignalConfig
export function tween(
  duration: number,
  fn: Quote<number>
) {
  return function (
    deltaX: number
  ) {
    return createAnimationTime(function (diffTime, setDisplacement) {
      const pc = diffTime / duration
      if (pc < 1) {
        setDisplacement(deltaX * fn(pc))
      } else {
        setDisplacement(deltaX)
        return true
      }
    })
  }
}

export type SpringBaseAnimationConfigArg = {
  config?: SpringBaseArg
  /**初始速度 v0 (可选) */
  initialVelocity?: number
  displacementThreshold?: number,
  velocityThreshold?: number
}

export function spring(arg: SpringBaseAnimationConfigArg = emptyObject) {
  return function (deltaX: number) {
    return springDetla(arg, deltaX)
  }
}

export const defaultSpringVocityThreshold = 2
export function springDetla(
  {
    initialVelocity = 0,
    config,
    /**默认0 */
    /**默认0.01 */
    displacementThreshold = 0.01,
    /**默认2 */
    velocityThreshold = defaultSpringVocityThreshold
  }: SpringBaseAnimationConfigArg,
  deltaX: number,
) {
  return createAnimationTime(function (diffTime, setDisplacement) {
    const out = springBase(diffTime, deltaX, initialVelocity, config, true)
    const stop = springIsStop(out, displacementThreshold, velocityThreshold)
    if (stop) {
      setDisplacement(deltaX)
    } else {
      setDisplacement(deltaX - out.displacement)
    }
    return stop
  })
}

export const defaultSpringAnimationConfig = spring()

export function springBaseAnimationConfigNoEnd(
  deltaX: number,
  {
    initialVelocity = 0,
    config,
    shouldStop = alawaysFalse
  }: {
    initialVelocity?: number
    config?: SpringBaseArg
    shouldStop?(v: SpringOutValue): boolean
  } = emptyObject
): Quote<number> {
  return function (diffTime) {
    const out = springBase(diffTime, deltaX, initialVelocity, config)
    const stop = shouldStop(out)
    if (stop) {
      return deltaX
    } else {
      return deltaX - out.displacement
    }
  }
}
