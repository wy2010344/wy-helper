import { ReadValueCenter, SetValue, ValueCenter, colorEqual, emptyFun, mixColor, mixNumber, simpleEqual, valueCenterOf } from "wy-helper"
import { AnimationConfig } from "wy-helper"


export function subscribeRequestAnimationFrame(callback: (time: number, isInit: boolean) => void, init?: boolean) {
  let canceled = false
  function request(time: number) {
    if (canceled) {
      return
    }
    callback(time, false)
    requestAnimationFrame(request)
  }
  if (init) {
    callback(performance.now(), true)
  }
  requestAnimationFrame(request)
  return function () {
    canceled = true
  }
}
/**
 * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
 * 或者总是使用flushSync.
 */
export class AnimateFrameValue<T> implements ReadValueCenter<T>{
  private value: ValueCenter<T>
  constructor(
    /**
     * 两个值是否相等
     */
    public readonly equal: (a: T, b: T) => any,
    /**
     * 取百分比
     */
    public readonly mixValue: (a: T, b: T, c: number) => T,
    initValue: T
  ) {
    this.value = valueCenterOf(initValue)
  }
  /**
   * 如果正在发生动画,这个值存在
   */
  private animateTo: {
    value: T
    config: AnimationConfig
  } | undefined = undefined
  getAnimateTo() {
    return this.animateTo
  }
  private lastCancel = emptyFun

  private clear() {
    this.lastCancel = emptyFun
    this.animateTo = undefined
  }
  changeTo(target: T, config?: AnimationConfig, onFinish: (v: boolean) => void = emptyFun) {
    if (!config) {
      //中止动画
      this.lastCancel()
      this.value.set(target)
      return 'immediately'
    }
    const baseValue = this.animateTo ? this.animateTo.value : this.value.get()
    if (this.equal(target, baseValue)) {
      //不会发生任何改变.
      return
    }
    this.lastCancel()
    this.animateTo = {
      value: target,
      config
    }
    const from = this.value.get()
    const timePeriod = performance.now()
    const that = this
    const c = config!
    const cancel = subscribeRequestAnimationFrame(function (date) {
      const diffTime = date - timePeriod
      if (diffTime < c.duration) {
        that.value.set(that.mixValue(from, target, c.fn(diffTime / c.duration)))
      } else {
        that.value.set(target)
        onFinish(true)
        cancel()
        that.clear()
      }
    })
    this.lastCancel = function () {
      onFinish(false)
      cancel()
      that.clear()
    }
    return 'animate'
  }
  get(): T {
    return this.value.get()
  }
  subscribe(fun: SetValue<T>) {
    return this.value.subscribe(fun)
  }
}
export function buildAnimateFrame<T>(
  /**
   * 两个值是否相等
   */
  equal: (a: T, b: T) => any,
  /**
   * 取百分比
   */
  mixValue: (a: T, b: T, c: number) => T
) {
  return function (
    value: T
  ) {
    return new AnimateFrameValue(equal, mixValue, value)
  }
}

export const animateNumberFrame = buildAnimateFrame(simpleEqual, mixNumber)
export const animateColorFrame = buildAnimateFrame(colorEqual, mixColor)
