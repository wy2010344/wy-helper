import { MomentumEndArg, MomentumJudgeBack } from "../scroller"
import { getDestination } from "../scroller/util"
import { AnimationConfig, TimeoutAnimationConfig } from "./AnimationConfig"
import { SpringOutValue } from "./spring"


/**
 * 效果始终不好,待定
 */
export class DammpingFactory {
  constructor(
    /**质量除以阻尼系数 */
    public readonly gamma: number,
    public readonly velocityThreshold = 2
  ) { }
  static from(
    /** 阻尼系数 d */
    damping: number,
    /** 质量 m */
    mass: number,
    velocityThreshold?: number
  ) {
    return new DammpingFactory(mass / damping, velocityThreshold)
  }
  getFromVelocity(initVelocity: number) {
    return new Dammping(this, initVelocity)
  }

  /**
   * 根据位移生成初始位置
   * @param distance 
   * @returns 
   */
  getFromDistance(distance: number) {
    const initialVelocity = distance / this.gamma
    return this.getFromVelocity(initialVelocity)
  }
  /**
   * 获得理想惯性动画
   */
  momentumIdeal(
    velocityThreshold = 2
  ) {
    const that = this
    return function (velocity: number): AnimationConfig {
      return new DampingAnimationConfig(that.getFromVelocity(velocity), velocityThreshold)
    }
  }

  /**
   * 获得惯性动画
   * @param param0 
   * @returns 
   */
  momentumJudge({
    current, velocity,
    lowerMargin, upperMargin
  }: MomentumEndArg): MomentumJudgeBack {
    velocity = velocity * 1000
    const dammping = this.getFromVelocity(velocity)
    if (lowerMargin < current && current < upperMargin) {
      //在容器内
      /**
       * (t: number) => SpringOutValue
       * 这里其实分两个阶段,
       * 阶段1,走到edge
       * 阶段2,走出edge,使用弹簧动画
       *  但这个弹簧动画,阻尼是知道的,质量也可能确定了,弹性系数不知道,deltaX是0
       */
      const destination = current + dammping.maxDistance
      if (destination < lowerMargin || destination > upperMargin) {
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
      const edge = getDestination(current, lowerMargin, upperMargin)
      return {
        type: "edge-back",
        from: current,
        target: edge
      }
      //从边缘恢复
      // return [
      //   getDestination(current, lowerMargin, upperMargin),
      //   new SpringBaseAnimationConfig({
      //     zta, omega0,
      //     initialVelocity: velocity,
      //     displacementThreshold,
      //     velocityThreshold
      //   })
      // ]
    }
  }
}

/**
 * 
 * gemini
 * x(t)=x(0)+v(0)*t-gamma*0.5*v(0)*t^2 ???
 * v(t)=v(0)*e^(-gamma*t)
 * chatgpt
 * x(t)=gamma*v(0)*(1-e^(gamma*t))
 * v(t)=v(0)*e^(-gamma*t) 这个二者一样
 */
export class Dammping {
  /**质量除以阻尼系数 */
  public readonly gamma: number
  constructor(
    public readonly factory: DammpingFactory,
    /**初始速度 */
    public readonly initVelocity: number,
  ) {
    this.gamma = this.factory.gamma
    this.maxDistance = this.gamma * initVelocity
    this.duration = this.getTimeToVelocity(this.factory.velocityThreshold)
  }
  readonly duration: number
  readonly maxDistance: number
  /**
   * 从初始速度到达指定速度的时间
   * @param initialVelocity 初始速度
   * @param velocity 指定速度
   * @returns 
   */
  getTimeToVelocity(
    velocity: number
  ) {
    return -Math.log(Math.abs(velocity / this.initVelocity)) / this.gamma
  }
  /**
   * 余下的路程
   * @param maxDistance 
   * @param elapsedTime 
   * @returns 
   */
  getDisplacement(
    /**时间 */
    elapsedTime: number
  ) {
    return this.maxDistance * Math.exp(- this.gamma * elapsedTime)
  }
  /**
   * 
   * x(t)=max(1-getDisplacement(t))
   * getDisplacement(t)=
   * 获得到达指定距离的时间,即滚动到达边界
   * @param initialVelocity 
   * @param distance 
   * @returns 
   */
  getTimeToDistance(
    distance: number) {
    return -Math.log(1 - Math.abs(distance / this.maxDistance)) / this.gamma
  }
  /**
   * 获得指定时间的速度
   * @param elapsedTime 
   * @returns 
   */
  getVelocity(
    /**时间 */
    elapsedTime: number
  ) {
    return this.initVelocity * Math.exp(-this.gamma * elapsedTime)
  }
}
/**
 * 阻尼力动画
 */
export class DampingAnimationConfig implements AnimationConfig {
  constructor(
    public readonly dammping: Dammping,
    public readonly endTime = dammping.duration
  ) {
  }
  initFinished(deltaX: number): boolean {
    return Math.abs(this.dammping.initVelocity) < this.dammping.factory.velocityThreshold
  }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    diffTime = diffTime / 1000
    return {
      displacement: deltaX - this.dammping.maxDistance + this.dammping.getDisplacement(diffTime),
      velocity: this.dammping.getVelocity(diffTime)
    }
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    if (diffTime >= this.endTime * 1000) {
      return true
    }
    if (out && Math.abs(out.velocity) < this.dammping.factory.velocityThreshold) {
      return true
    }
    return false
  }
}
