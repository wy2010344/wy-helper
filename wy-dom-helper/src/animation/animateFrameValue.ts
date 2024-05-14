import { ReadValueCenter, SetValue, ValueCenter, animateFrameReducer, colorAdd, colorEqual, emptyFun, emptyObject, mathAdd, mixColor, mixNumber, mixPointNumber, pointAddNumber, pointEqual, simpleEqual, valueCenterOf } from "wy-helper"
import { AnimationConfig } from "wy-helper"


export function subscribeRequestAnimationFrame(
  callback: (time: number, isInit: boolean) => void,
  init?: boolean
) {
  return superSubscribeRequestAnimationFrame(requestAnimationFrame, callback, init)
}

export function superSubscribeRequestAnimationFrame(
  requestAnimationFrame: (fun: SetValue<number>) => void,
  callback: (time: number, isInit: boolean) => void,
  init?: boolean
) {
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


class AnimateTo {
  constructor(
    public from: number,
    public target: number,
    public config: AnimationConfig,
    private setValue: (v: number, onProcess?: boolean) => void
  ) { }

  private time: number = 0
  update(diffTime: number, onProcess?: boolean) {
    this.time = diffTime
    const c = this.config
    const value = mixNumber(this.from, this.target, c.fn(diffTime / c.duration))
    this.setValue(value, onProcess)
  }

  reDo() {
    this.update(this.time)
  }
}

export type AnimateFrameEvent = {
  from?: number
  onProcess?(v: number): void
  onFinish?(v: boolean): void
}
/**
 * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
 * 或者总是使用flushSync.
 */
export class AnimateFrameValue implements ReadValueCenter<number> {
  private value: ValueCenter<number>
  constructor(
    initValue: number,
    private requestAnimateFrame = requestAnimationFrame
  ) {
    this.value = valueCenterOf(initValue)
  }
  /**
   * 如果正在发生动画,这个值存在
   */
  private animateTo: AnimateTo | undefined = undefined
  getAnimateTo() {
    return this.animateTo
  }
  private lastCancel = emptyFun

  private clear() {
    this.lastCancel = emptyFun
    this.animateTo = undefined
  }
  slientChange(target: number, from: number = target) {
    if (this.animateTo) {
      this.animateTo.from = from
      this.animateTo.target = target
      this.animateTo.reDo()
    } else {
      this.value.set(target)
    }
  }
  slientDiff(diff: number) {
    if (this.animateTo) {
      this.animateTo.from = this.animateTo.from + diff
      this.animateTo.target = this.animateTo.target + diff
      this.animateTo.reDo()
    } else {
      this.value.set(this.value.get() + diff)
    }
  }
  changeTo(target: number, config?: AnimationConfig, {
    from,
    onProcess = emptyFun,
    onFinish = emptyFun
  }: AnimateFrameEvent = emptyObject) {
    if (!config) {
      //中止动画
      this.lastCancel()
      this.value.set(target)
      return 'immediately'
    }
    const baseValue =
      typeof from != 'undefined'
        ? from : this.animateTo
          ? this.animateTo.target : this.value.get()
    if (target = baseValue) {
      //不会发生任何改变.
      return
    }
    this.lastCancel()
    const that = this
    const animateTo = new AnimateTo(
      baseValue,
      target,
      config,
      (v, o) => {
        that.value.set(v)
        if (o) {
          onProcess(v)
        }
      })
    this.animateTo = animateTo
    const timePeriod = performance.now()
    const cancel = superSubscribeRequestAnimationFrame(this.requestAnimateFrame, function (date) {
      const diffTime = date - timePeriod
      const toValue = animateTo.target
      const c = animateTo.config
      if (diffTime < c.duration) {
        if (diffTime > 0) {
          //不明白为什么,但确实会出现diffTime小于0
          animateTo.update(diffTime, true)
        }
      } else {
        that.value.set(toValue)
        cancel()
        that.clear()
        //在trigger里访问到animateTo已经结束
        onFinish(true)
      }
    })
    this.lastCancel = function () {
      cancel()
      that.clear()
      //在trigger里访问到animateTo已经结束
      onFinish(false)
    }
    return 'animate'
  }
  get() {
    return this.value.get()
  }
  subscribe(fun: SetValue<number>) {
    return this.value.subscribe(fun)
  }
}

export function animateNumberFrame(value: number, requestAnimateFrame = requestAnimationFrame) {
  return new AnimateFrameValue(value, requestAnimateFrame)
}
export const animateNumberFrameReducer = animateFrameReducer(requestAnimationFrame)

