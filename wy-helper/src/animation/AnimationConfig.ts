import { mixNumber } from "../NumberHelper"
import { EaseFn } from "../scroller"
import { emptyObject } from "../util"
import { SpringOutValue, springBase, springIsStop } from "./spring"


export interface AnimationConfig {

  computed(diffTime: number, from: number, target: number): SpringOutValue
  finished(diffTime: number, out?: SpringOutValue): boolean
  initFinished(from: number, target: number): boolean
}



export class TweenAnimationConfig implements AnimationConfig {
  constructor(
    public readonly duration: number,
    public readonly fn: EaseFn
  ) { }
  computed(diffTime: number, from: number, target: number): SpringOutValue {
    const value = mixNumber(from, target, this.fn(diffTime / this.duration))
    return {
      displacement: target - value,
      velocity: 0
    }
  }
  finished(diffTime: number): boolean {
    return diffTime >= this.duration
  }
  initFinished(from: number, target: number) {
    return false
  }
}

export class SpringBaseAnimationConfig implements AnimationConfig {
  public readonly displacementThreshold: number
  public readonly velocityThreshold: number
  public readonly zta: number
  public readonly omega0: number
  public readonly initialVelocity: number
  constructor({
    zta = 1,
    omega0 = 8,
    initialVelocity = 0,
    displacementThreshold = 0.01,
    velocityThreshold = 2
  }: {
    /**阻尼比:0~1~无穷,0~1是欠阻尼,即会来回,1~无穷不会来回*/
    zta?: number,
    /**自由振荡角频率 */
    omega0?: number,
    /**初始速度 v0 (可选) */
    initialVelocity?: number
    displacementThreshold?: number,
    velocityThreshold?: number
  } = emptyObject) {
    this.zta = zta
    this.omega0 = omega0
    this.initialVelocity = initialVelocity
    this.displacementThreshold = displacementThreshold
    this.velocityThreshold = velocityThreshold
  }
  computed(diffTime: number, from: number, target: number) {
    return springBase({
      ...this,
      deltaX: target - from,
      elapsedTime: diffTime / 1000
    })
  }
  initFinished(from: number, target: number) {
    return this.finished(0, {
      velocity: this.initialVelocity,
      displacement: target - from
    })
  }
  finished(diffTime: number, out?: SpringOutValue): boolean {
    if (out) {
      return springIsStop(out, this.displacementThreshold, this.velocityThreshold)
    }
    return false
  }
}


export function getTimeToVelocity(
  gamma: number,
  initialVelocity: number,
  velocity: number
) {
  return -Math.log(Math.abs(velocity / initialVelocity)) / gamma
}

/**
 * 获得初始速度下的最大运动距离
 * @param initialVelocity 
 * @returns 
 */
export function getMaxDistance(
  gamma: number,
  /**初始速度 */
  initialVelocity: number
) {
  return gamma * initialVelocity
}
function getDisplacement(
  gamma: number,
  /**初始速度 */
  initialVelocity: number,
  /**时间 */
  elapsedTime: number
) {
  return getMaxDistance(gamma, initialVelocity) * Math.exp(-gamma * elapsedTime)
}
export class DampingAnimationConfig implements AnimationConfig {
  constructor(
    public readonly gamma: number,
    public readonly initVelocity: number,
    public readonly velocityThreshold: number
  ) {
    this.endT = getTimeToVelocity(gamma, initVelocity, velocityThreshold)
  }
  endT: number
  initFinished(from: number, target: number): boolean {
    return Math.abs(this.initVelocity) < this.velocityThreshold
  }
  computed(diffTime: number, from: number, target: number): SpringOutValue {
    const t = diffTime / 1000
    return {
      displacement: getDisplacement(this.gamma, this.initVelocity, t),
      velocity: Infinity
    }
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    const t = diffTime / 1000
    return this.endT < t
  }
}


export class DampingEdgeAnimationConfig implements AnimationConfig {
  constructor(
    public readonly gamma: number,
    /**阻尼比:0~1~无穷,0~1是欠阻尼,即会来回,1~无穷不会来回*/
    public readonly zta: number,
    /**自由振荡角频率 */
    public readonly omega0: number,
    public readonly initVelocity: number,
    public readonly centerVelocity: number,
    public readonly velocityThreshold: number,
    public readonly displacementThreshold: number,
    public readonly nt: number
  ) {
  }
  initFinished(from: number, target: number): boolean {
    return false
  }
  computed(diffTime: number, from: number, target: number): SpringOutValue {
    const t = diffTime / 1000
    if (t <= this.nt) {
      return {
        displacement: getDisplacement(this.gamma, this.initVelocity, t),
        velocity: Infinity
      }
    } else {
      return springBase({
        zta: this.zta,
        omega0: this.omega0,
        //这里不应该为0
        deltaX: 0,
        initialVelocity: this.centerVelocity,
        elapsedTime: t - this.nt
      })
    }
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    const t = diffTime / 1000
    if (t > this.nt) {
      if (out) {
        return springIsStop(out, this.displacementThreshold, this.velocityThreshold)
      }
    }
    return false
  }
}