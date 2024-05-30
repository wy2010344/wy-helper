import { MomentumCall, MomentumCallOut, MomentumEndArg, MomentumJudgeBack, OldGetValue } from "."
import { emptyObject } from "../util"
import { ScrollEdgeAnimation, getDestination } from "./util"

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

  getDestinationWithMargin(
    get: OldGetValue,
  ): MomentumCall {
    const that = this
    return function (
      {
        current, velocity,
        lowerMargin, upperMargin, wrapperSize
      }: MomentumEndArg) {

      if (lowerMargin < current && current < upperMargin) {
        let { distance, duration, absSpeed } = that.getWithSpeedIdeal(velocity)
        let destination = current + distance
        let rate = 15
        let edge = false

        let finalPosition = 0

        if (destination < lowerMargin) {
          destination = wrapperSize
            ? Math.max(
              lowerMargin - wrapperSize / 4,
              lowerMargin - (wrapperSize / rate) * absSpeed
            )
            : lowerMargin
          duration = that.swipeBounceTime
          edge = true
          finalPosition = lowerMargin
        } else if (destination > upperMargin) {
          destination = wrapperSize
            ? Math.min(
              upperMargin + wrapperSize / 4,
              upperMargin + (wrapperSize / rate) * absSpeed
            )
            : upperMargin
          duration = that.swipeBounceTime
          edge = true
          finalPosition = upperMargin
        }
        if (edge) {
          const before = get.getOnDragEnd(duration, true)
          return [
            finalPosition,
            new ScrollEdgeAnimation(
              before,
              duration,
              destination - current,
              finalPosition - destination,
              get.onEdgeBack)]
        }
        return [destination, get.getOnDragEnd(duration, false)]
      } else {
        return [getDestination(current, lowerMargin, upperMargin), get.onEdgeBack]
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
