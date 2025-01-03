import { MomentumCall, MomentumCallOut, MomentumEndArg, OldGetValue } from "."
import { combineAnimationConfig } from "../animation"
import { emptyObject } from "../util"
import { getDestination } from "./util"

export class MomentumBScoll {
  private constructor(
    //表示 momentum 动画的减速度。
    public readonly deceleration = 0.0015,
    //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
    public readonly swipeBounceTime = 500,
    //设置 momentum 动画的动画时长。
    public readonly swipeTime = 2500
  ) { }
  getWithSpeedIdeal(velocity: number) {
    const absSpeed = Math.abs(velocity)
    const duration = Math.min(this.swipeTime, (absSpeed * 2) / this.deceleration)
    const dir = velocity < 0 ? -1 : 1
    return {
      dir,
      absSpeed,
      distance: ((velocity * velocity) / this.deceleration) * dir,
      duration
    }
  }

  destinationWithMargin(
    {
      current, velocity,
      lowerMargin, upperMargin, containerSize
    }: MomentumEndArg
  ): MomentumCallOut {
    if (lowerMargin < current && current < upperMargin) {
      let { distance, duration, absSpeed } = this.getWithSpeedIdeal(velocity)
      let destination = current + distance
      let rate = 15
      let edge = false

      let finalPosition = 0

      if (destination < lowerMargin) {
        destination = containerSize
          ? Math.max(
            lowerMargin - containerSize / 4,
            lowerMargin - (containerSize / rate) * absSpeed
          )
          : lowerMargin
        duration = this.swipeBounceTime
        edge = true
        finalPosition = lowerMargin
      } else if (destination > upperMargin) {
        destination = containerSize
          ? Math.min(
            upperMargin + containerSize / 4,
            upperMargin + (containerSize / rate) * absSpeed
          )
          : upperMargin
        duration = this.swipeBounceTime
        edge = true
        finalPosition = upperMargin
      }
      if (edge) {
        return {
          type: "scroll-edge",
          duration,
          from: current,
          target: destination,
          finalPosition: finalPosition,
        }
      }
      return {
        type: "scroll",
        duration,
        from: current,
        target: destination
      }
    } else {
      const finalPosition = getDestination(current, lowerMargin, upperMargin)
      return {
        type: "edge-back",
        from: current,
        target: finalPosition
      }
    }
  }

  static readonly default = new MomentumBScoll()
  static get(arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
    //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
    swipeBounceTime?: number,
    //设置 momentum 动画的动画时长。
    swipeTime?: number
  } = emptyObject) {
    if (!arg) {
      return MomentumBScoll.default
    }
    const d = MomentumBScoll.default
    if ((!arg.deceleration || arg.deceleration == d.deceleration)
      || (!arg.swipeBounceTime || arg.swipeBounceTime == d.swipeBounceTime)
      || (!arg.swipeTime || arg.swipeTime == d.swipeTime)
    ) {
      return d
    }
    return new MomentumBScoll(arg.deceleration, arg.swipeBounceTime, arg.swipeTime)
  }
}
