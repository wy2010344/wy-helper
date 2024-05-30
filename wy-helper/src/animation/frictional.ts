import { MomentumEndArg, MomentumJudge, MomentumJudgeBack } from "../scroller"
import { getDestination } from "../scroller/util"
import { AnimationConfig, TimeoutAnimationConfig } from "./AnimationConfig"
import { SpringOutValue } from "./spring"



export class FrictionalFactory {
  constructor(
    /**
     * 减速度
     */
    public readonly deceleration = 0.0006,
  ) {
    this.deceleration = Math.abs(deceleration)
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
  momentumJudge({
    current, velocity,
    lowerMargin, upperMargin
  }: MomentumEndArg): MomentumJudgeBack {
    const frictional = this.getFromVelocity(velocity)
    if (lowerMargin < current && current < upperMargin) {
      const destination = current + frictional.maxDistance
      if (destination < lowerMargin || destination > upperMargin) {
        /**
         * (t: number) => SpringOutValue
         * 这里其实分两个阶段,
         * 阶段1,惯性走到edge
         * 阶段2,走出edge,带着初始速度,摩擦系数增大或如何
         * 阶段3,到达最大距离,回弹,使用边缘外运行的距离或初始速度或用时
         *    这里,与拖拽到边缘一致,使用最大距离
         */
        const edge = getDestination(destination, lowerMargin, upperMargin)
        return {
          type: "scroll-edge",
          from: current,
          target: edge
        }
      } else {
        return {
          type: "scroll",
          from: current,
          target: destination
        }
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
    this.deceleration = factory.deceleration * this.dir
    this.duration = this.initVelocity / this.deceleration
    this.maxDistance = 0.5 * initVelocity ** 2 / this.deceleration
  }
  readonly duration: number
  readonly maxDistance: number

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
    elapsedTime: number) {
    return this.maxDistance - this.getDistance(elapsedTime)
  }

  /**
   * 位移
   * @param elapsedTime 
   * @returns 
   */
  getDistance(
    elapsedTime: number
  ) {
    return this.initVelocity * elapsedTime - 0.5 * this.deceleration * elapsedTime * elapsedTime
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
}

/**
 * 摩擦阻力的动画
 */
export class FrictionalAnimationConfig extends TimeoutAnimationConfig {
  constructor(
    public readonly frictional: Frictional,
    endTime = frictional.duration
  ) {
    super(endTime)
  }
  initFinished(deltaX: number): boolean {
    return false
  }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    return {
      displacement: deltaX - this.frictional.getDistance(diffTime),
      //不计算
      velocity: Infinity// this.frictional.getVelocity(diffTime)
    }
  }
}