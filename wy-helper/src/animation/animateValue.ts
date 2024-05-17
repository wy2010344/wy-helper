import { AnimationConfig } from "."
import { mixNumber } from "../NumberHelper"
import { colorEqual, mixColor } from "../color"
import { simpleEqual } from "../equal"
import { EmptyFun, emptyFun } from "../util"



export type AnimateLatestConfig = {
  fromTime: number
  fromValue: number
  onFinish(v: boolean): void
  config: AnimationConfig
}

export class AnimateValue {
  constructor(
    public readonly reload: EmptyFun,
    private value: number
  ) {
    this.lastTriggerValue = value
    this.trigger = {
      toValue: value,
      onFinish: emptyFun
    }
  }
  private trigger: {
    toValue: number
    config?: AnimationConfig
    onFinish(success: boolean): void
  }
  private lastTriggerValue: number
  private lastTrigger: undefined | AnimateLatestConfig
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
    toValue: number,
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
    if (this.lastTriggerValue != toValue) {
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
        this.value = mixNumber(this.lastTrigger.fromValue, toValue, percent)
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