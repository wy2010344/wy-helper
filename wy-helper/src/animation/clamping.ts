import { emptyObject } from "../util"
import { createAnimationTime } from "./animateSignal"
import { ScrollHelper } from "./destinationWithMargin"
import { globalDefaultDisplacementThreshold } from "./spring"

/**
 * flutter使用的这个模型
 */
export class ClampingScrollFactory {
  private constructor(
    readonly drag: number,
    readonly displacementThreshold: number
  ) { }

  static get(drag: number = 2, displacementThreshold: number = globalDefaultDisplacementThreshold) {
    return new ClampingScrollFactory(drag, displacementThreshold)
  }

  static edgeClampingConfig(velocity: number, displacementThreshold = globalDefaultDisplacementThreshold) {
    return ClampingScrollFactory.get(100, displacementThreshold).getFromVelocity(velocity).animationConfig()
  }

  getFromDistance(n: number) {
    const initVelocity = n * this.drag / 1000
    return new ClampingScroll(this, initVelocity)
  }
  getFromVelocity(n: number) {
    return new ClampingScroll(this, n)
  }
}


/**
 * 据deepseek言,是flutter里的动画
 */
export class ClampingScroll implements ScrollHelper {
  private velocitySecond: number
  constructor(
    readonly factory: ClampingScrollFactory,
    readonly initVelocity: number
  ) {
    this.velocitySecond = initVelocity * 1000
    this.distance = this.velocitySecond / factory.drag
  }
  cloneFromDistance(distance: number): ScrollHelper {
    throw this.factory.getFromDistance(distance)
  }

  // 除以1000,变成秒
  getDisplacement(
    elapsedTime: number
  ) {
    return this.distance * (1 - Math.exp(-this.factory.drag * elapsedTime / 1000))
  }
  readonly distance: number


  //*1000,变成毫秒
  getTimeToDistance(value: number) {
    return -Math.log(1 - value * this.factory.drag / this.velocitySecond) * 1000 / this.factory.drag
  }

  getVelocity(elapsedTime: number) {
    return this.initVelocity * Math.exp(-this.factory.drag * elapsedTime / 1000)
  }

  animationConfig(duration = Infinity) {
    const it = this
    return createAnimationTime(function (diffTime, setDisplacement) {
      if (diffTime < duration) {
        const distanceNow = it.getDisplacement(diffTime)
        const delta = distanceNow - it.distance
        if (Math.abs(delta) < it.factory.displacementThreshold) {
          setDisplacement(it.distance)
          return true
        } else {
          setDisplacement(distanceNow)
        }
      } else {
        setDisplacement(it.getDisplacement(diffTime))
        return true
      }
    })
  }
}