import { mixNumber } from "../NumberHelper"
import { EaseFn } from "../scroller"
import { emptyObject } from "../util"
import { SpringOutValue, springBase, springIsStop } from "./spring"


export interface AnimationConfig {

  computed(diffTime: number, deltaX: number): SpringOutValue
  finished(diffTime: number, out?: SpringOutValue): boolean
  initFinished(deltaX: number): boolean
}



export abstract class TimeoutAnimationConfig implements AnimationConfig {
  constructor(
    public readonly duration: number
  ) { }
  abstract initFinished(deltaX: number): boolean
  abstract computed(diffTime: number, deltaX: number): SpringOutValue
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    return diffTime >= this.duration
  }
  joinTime(a: TimeoutAnimationConfig) {
    return new TimeoutAnimationJoinConfig(this, a)
  }
  join(a: AnimationConfig) {
    return new TimeNotAnimationJoinConfig(this, a)
  }
}

export class TimeNotAnimationJoinConfig implements AnimationConfig {
  constructor(
    public readonly left: TimeoutAnimationConfig,
    public readonly right: AnimationConfig
  ) { }
  initFinished(deltaX: number): boolean {
    return this.left.initFinished(deltaX)
  }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    if (this.left.finished(diffTime)) {
      return this.right.computed(diffTime - this.left.duration, deltaX)
    }
    return this.left.computed(diffTime, deltaX)
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    if (this.left.finished(diffTime, out)) {
      return this.right.finished(diffTime - this.left.duration, out)
    }
    return false
  }
}
export class TimeoutAnimationJoinConfig extends TimeoutAnimationConfig {
  constructor(
    public readonly left: TimeoutAnimationConfig,
    public readonly right: TimeoutAnimationConfig
  ) {
    super(left.duration + right.duration)
  }
  initFinished(deltaX: number): boolean {
    return this.left.initFinished(deltaX)
  }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    if (this.left.finished(diffTime)) {
      return this.right.computed(diffTime - this.left.duration, deltaX)
    }
    return this.left.computed(diffTime, deltaX)
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    if (this.left.finished(diffTime, out)) {
      return this.right.finished(diffTime - this.left.duration, out)
    }
    return false
  }
}
export class TweenAnimationConfig implements AnimationConfig {
  constructor(
    public readonly duration: number,
    public readonly fn: EaseFn
  ) { }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    return {
      displacement: deltaX - deltaX * this.fn(diffTime / this.duration),
      velocity: 0
    }
  }
  finished(diffTime: number): boolean {
    return diffTime >= this.duration
  }
  initFinished(deltaX: number) {
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
  computed(diffTime: number, deltaX: number) {
    return springBase({
      ...this,
      deltaX,
      elapsedTime: diffTime / 1000
    })
  }
  initFinished(deltaX: number) {
    return this.finished(0, {
      velocity: this.initialVelocity,
      displacement: deltaX
    })
  }
  finished(diffTime: number, out?: SpringOutValue): boolean {
    if (out) {
      return springIsStop(out, this.displacementThreshold, this.velocityThreshold)
    }
    return false
  }
}
