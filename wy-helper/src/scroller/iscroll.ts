import { MomentumCall, MomentumCallOut, MomentumEndArg, OldGetValue } from ".";
import { AnimationConfig, SpringOutValue } from "../animation";
import { ScrollEdgeAnimation, getDestination } from "./util";

export class MomentumIScroll {
  private constructor(
    public readonly deceleration = 0.0006
  ) {
    this.deceleration = Math.abs(deceleration)
  }

  idealFn(t: number, dir: -1 | 1, absSpeed: number) {
    //(初速度+末速度)*t/2
    return dir * t * (absSpeed + (absSpeed - this.deceleration * t)) / 2
  }
  /**
   * 通过速度获得理想的信息
   * @param velocity 
   * @returns 
   */
  getWithSpeedIdeal(velocity: number) {
    const absSpeed = Math.abs(velocity)
    //速度除以减速度,得变成0的时间
    const duration = absSpeed / this.deceleration;

    const dir = velocity < 0 ? -1 : 1
    //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
    const distance = duration * (absSpeed / 2) * dir;

    return {
      dir,
      absSpeed,
      distance,
      duration
    }
  }
  /**
   * 通过位移倒推速度和时间
   * @param distance 
   * @returns 
   */
  getWithDistanceIdeal(distance: number) {
    const speed = Math.cbrt(distance * 2 * this.deceleration)
    const duration = Math.abs(speed / this.deceleration)
    return {
      speed,
      duration
    }
  }
  /**
   * 有边界的情况,受边界弹性的影响
   * @param current 
   * @param velocity 
   * @param wrapperSize 
   * @param lowerMargin 
   * @param upperMargin 
   * @returns 
   */
  getDestinationWithMargin(
    get: OldGetValue
  ): MomentumCall {
    const that = this
    return function (
      {
        current, velocity,
        lowerMargin, upperMargin, wrapperSize
      }: MomentumEndArg,) {

      if (lowerMargin < current && current < upperMargin) {
        //在边界内部
        let { absSpeed, duration, distance } = that.getWithSpeedIdeal(velocity)
        //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
        let destination = current + distance
        let edge = false
        let finalPosition = 0
        //超出边界的时间,减少位移
        if (destination < lowerMargin) {
          destination = wrapperSize ? lowerMargin - wrapperSize / 2.5 * (absSpeed / 8) : lowerMargin;
          let distance = Math.abs(destination - current);
          duration = distance / absSpeed;
          edge = true
          finalPosition = lowerMargin
        } else if (destination > upperMargin) {
          destination = wrapperSize ? upperMargin + wrapperSize / 2.5 * (absSpeed / 8) : upperMargin;
          let distance = Math.abs(current) + destination;
          duration = distance / absSpeed;
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
        //在边界外面
        return [getDestination(current, lowerMargin, upperMargin), get.onEdgeBack]
      }
    }
  }
  static readonly default = new MomentumIScroll()
  static get(deceleration?: number) {
    let iScroll: MomentumIScroll
    if (!deceleration || deceleration == MomentumIScroll.default.deceleration) {
      iScroll = MomentumIScroll.default
    } else {
      iScroll = new MomentumIScroll(deceleration)
    }
    return iScroll
  }
}
