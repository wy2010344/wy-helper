import { MomentumCallOut } from "../scroller"
import { getDestination, getMaxScroll } from "../scroller/util"
import { AnimationConfig } from "./AnimationConfig"
import { easeInOut, easeOut, EaseType } from "./tween"


/**
 * 摩擦,即是减速度,和weight相反
 * 待处理
 */
export class FrictionalFactory {
  private constructor(
    public readonly deceleration: number
  ) {
    this.deceleration = Math.abs(deceleration)
    if (this.deceleration == 0) {
      throw new Error(`deceleration cann't be 0`)
    }
  }
  /**
   * 
   * @param deceleration 减速度,默认0.0006
   * @returns 
   */
  static get(deceleration = 0.0006) {
    return new FrictionalFactory(deceleration)
  }

  getFromVelocity(initVelocity: number) {
    return new Frictional(this, initVelocity)
  }

  /**
   * elapsedTime=initVelocity/deceleration
   * initVelocity * elapsedTime - 0.5 * this.deceleration * elapsedTime * elapsedTime=distance
   * 或者 0.5*initVelocity*elapsedTime=distance
   * 
   * v*v/a-0.5v*v/a=distance
   * 0.5*v*v/a=distance
   * 根据位移量生成,主要是卡片必须刚好滚动到相应位置需要调整初始速度
   * @param distance 
   */
  getFromDistance(distance: number) {
    const dir = distance < 0 ? -1 : 1
    const initVelocity = dir * Math.sqrt(distance * this.deceleration * dir * 2)
    return this.getFromVelocity(initVelocity)
  }
  /**
   * 像iScroll一样,滚动到外部,有最大距离
   * @param param0 
   * @returns 
   */
  destinationWithMarginIscroll({
    current, velocity,
    containerSize,
    contentSize
  }: {
    /** < 0 当前位移 */
    current: number,
    /**
     * 负是向上,正是向下
     */
    velocity: number,
    containerSize: number,
    contentSize: number
  }): MomentumCallOut {

    const lowerMargin = 0
    const upperMargin = getMaxScroll(containerSize, contentSize)
    const frictional = this.getFromVelocity(velocity)
    if (lowerMargin < current && current < upperMargin) {
      let destination = current + frictional.distance
      /**
       * (t: number) => SpringOutValue
       * 这里其实分两个阶段,
       * 阶段1,惯性走到edge
       * 阶段2,走出edge,带着初始速度,摩擦系数增大或如何
       * 阶段3,到达最大距离,回弹,使用边缘外运行的距离或初始速度或用时
       *    这里,与拖拽到边缘一致,使用最大距离
       */
      let edge = false
      let finalPosition = 0
      let duration = 0
      if (destination < lowerMargin) {
        edge = true
        finalPosition = lowerMargin
        const absSpeed = Math.abs(velocity)
        destination = lowerMargin - containerSize / 2.5 * (absSpeed / 8);
        const distance = current - destination
        duration = distance / absSpeed
      } else if (destination > upperMargin) {
        edge = true
        finalPosition = upperMargin
        const absSpeed = Math.abs(velocity)
        destination = upperMargin + containerSize / 2.5 * (absSpeed / 8);
        const distance = destination - current
        duration = distance / absSpeed
      }

      if (edge) {
        return {
          type: "scroll-edge",
          from: current,
          target: destination,
          finalPosition: finalPosition,
          duration
        }
      }

      return {
        type: "scroll",
        from: current,
        target: destination,
        duration: frictional.duration
      }
    } else {
      //从边缘恢复,回弹
      const edge = getDestination(current, lowerMargin, upperMargin)
      return {
        type: "edge-back",
        from: current,
        target: edge
      }
    }
  }
}

export class Frictional {
  //初速度的绝对值
  public readonly absInitVelocity: number
  public readonly deceleration: number
  public readonly dir: -1 | 1
  constructor(
    public readonly factory: FrictionalFactory,
    /**
     * 初速度
     */
    public readonly initVelocity: number
  ) {
    this.dir = initVelocity < 0 ? -1 : 1
    this.absInitVelocity = this.dir * initVelocity
    //减速度取与速度方向相反为正
    this.deceleration = factory.deceleration * this.dir
    this.duration = this.initVelocity / this.deceleration
    this.distance = 0.5 * initVelocity ** 2 / this.deceleration
  }
  //持续时间
  readonly duration: number
  //最大位移量
  readonly distance: number

  /**获得速度 */
  getVelocity(
    /**时间 */
    elapsedTime: number
  ) {
    return this.initVelocity - this.deceleration * elapsedTime
  }
  /**
   * 位移:v0t-0.5at^2
   * 剩余量:
   *  0.5*initVelocity**2/deceleration //最大量
   * -initVelocity * elapsedTime - 0.5 * deceleration * elapsedTime * elapsedTime
   * @param elapsedTime 
   * @returns 
   */
  getDisplacement(
    /**时间 */
    elapsedTime: number
  ) {
    return this.distance - this.getDistance(elapsedTime)
  }

  /**
   * 位移
   * @param elapsedTime 
   * @returns 
   */
  getDistance = (
    elapsedTime: number
  ) => {
    return this.initVelocity * elapsedTime - 0.5 * this.deceleration * elapsedTime * elapsedTime
  }
  getEasyInOutDistance = (elapsedTime: number) => {
    return easeInOut(elapsedTime, this.getDistance, this.distance, this.duration)
  }
  getEasyOutDistance = (elapsedTime: number) => {
    return easeOut(elapsedTime, this.getDistance, this.distance, this.duration)
  }
  /**
   * 就是求一元二次方程的解
   * a= -0.5 * this.deceleration
   * b= this.initVelocity
   * c=-distance
   * 
   * 
   * -b+-sqrt(b*b-4ac)/2a
   * 
   * -initVelocity+-sqrt(deceleration*deceleration-2*deceleration*distance)/-deceleration
   * 
   * @param distance 
   */
  getTimeToDistance(distance: number) {
    return (this.initVelocity - this.dir * Math.sqrt(this.initVelocity * this.initVelocity - 2 * this.deceleration * distance)) / this.deceleration
  }

  /**
   * 到达指定速度的时间
   * @param velocity 
   * @returns 
   */
  getTimeToVelocity(
    velocity: number) {
    return (this.initVelocity - velocity) / this.deceleration
  }



  animationConfig(
    ease: EaseType = "in",
    endTime = this.duration): AnimationConfig {
    let getDistance = this.getDistance
    if (ease == 'out') {
      getDistance = this.getEasyOutDistance
    } else if (ease == 'in-out') {
      getDistance = this.getEasyInOutDistance
    }
    return function (diffTime) {
      if (diffTime < endTime) {
        const value = getDistance(diffTime)
        return [value, false]
      } else {
        return [getDistance(endTime), true]
      }
    }
  }
}