import { AnimationConfig } from "."
import { mixNumber } from "../NumberHelper"
import { colorEqual, mixColor } from "../color"
import { simpleEqual } from "../equal"
import { EmptyFun, emptyFun } from "../util"



export type AnimateLatestConfig<T> = {
  fromTime: number
  fromValue: T
  onFinish(v: boolean): void
  config: AnimationConfig
}

export class AnimateValue<T>{
  constructor(
    /**
     * 两个值是否相等
     */
    public readonly equal: (a: T, b: T) => any,
    /**
     * 取百分比
     */
    public readonly mixValue: (a: T, b: T, c: number) => T,
    public readonly reload: EmptyFun,
    private value: T
  ) {
    this.lastTriggerValue = value
    this.trigger = {
      toValue: value,
      onFinish: emptyFun
    }
  }
  private trigger: {
    toValue: T
    config?: AnimationConfig
    onFinish(success: boolean): void
  }
  private lastTriggerValue: T
  private lastTrigger: undefined | AnimateLatestConfig<T>
  getValue() {
    return this.value
  }
  getLastTriggerValue() {
    return this.lastTriggerValue
  }
  getLastTrigger() {
    return this.lastTrigger
  }
  changeTo(
    toValue: T,
    config?: AnimationConfig,
    onFinish: (success: boolean) => void = emptyFun
  ) {
    this.trigger.toValue = toValue
    this.trigger.config = config
    this.trigger.onFinish = onFinish
    this.reload()
  }
  checkValue() {
    const { toValue, config, onFinish } = this.trigger
    if (!config) {
      this.lastTriggerValue = toValue
      this.lastTrigger = undefined
      this.value = toValue
      return toValue
    }
    if (!this.equal(this.lastTriggerValue, toValue)) {
      this.lastTriggerValue = toValue
      this.lastTrigger?.onFinish(false)
      this.lastTrigger = {
        onFinish,
        fromTime: Date.now(),
        fromValue: this.value,
        config
      }
      this.reload()
      return this.value
    }
    if (this.lastTrigger) {
      const t = Date.now() - this.lastTrigger.fromTime
      const du = this.lastTrigger.config.duration
      if (t < du) {
        const percent = this.lastTrigger.config.fn(t / du)
        this.value = this.mixValue(this.lastTrigger.fromValue, toValue, percent)
        this.reload()
        return this.value
      } else {
        this.lastTrigger.onFinish(true)
        this.lastTrigger = undefined
        this.value = toValue
        return toValue
      }
    }
    return this.value
  }
}
export function buildAnimate<T>(
  /**
   * 两个值是否相等
   */
  equal: (a: T, b: T) => any,
  /**
   * 取百分比
   */
  mixValue: (a: T, b: T, c: number) => T
) {
  return function (reload: EmptyFun, initValue: T) {
    return new AnimateValue(equal, mixValue, reload, initValue)
  }
}


export const animateNumber = buildAnimate(simpleEqual, mixNumber)
export const animateColor = buildAnimate(colorEqual, mixColor)