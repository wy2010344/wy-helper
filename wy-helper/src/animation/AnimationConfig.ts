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