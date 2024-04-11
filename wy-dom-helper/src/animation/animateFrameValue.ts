import { AnimateFrameChangeTo, AnimateFrameModel, AnimateLatestConfig, EmptyFun, FrameTick, ReadValueCenter, Reducer, SetValue, ValueCenter, animateFrameReducer, colorEqual, emptyFun, emptyObject, mixColor, mixNumber, simpleEqual, valueCenterOf } from "wy-helper"
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

class AnimateTo<T> {
  constructor(

    public from: T,
    public target: T,
    public config: AnimationConfig,
    private mixValue: (a: T, b: T, c: number) => T,
    private setValue: (v: T, onProcess?: boolean) => void
  ) { }

  private time: number = 0
  update(diffTime: number, onProcess?: boolean) {
    this.time = diffTime
    const c = this.config
    const value = this.mixValue(this.from, this.target, c.fn(diffTime / c.duration))
    this.setValue(value, onProcess)
  }

  reDo() {
    this.update(this.time)
  }
}

export type AnimateFrameEvent<T> = {
  from?: T
  onProcess?(v: T): void
  onFinish?(v: boolean): void
}
/**
 * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
 * 或者总是使用flushSync.
 */
export class AnimateFrameValue<T> implements ReadValueCenter<T> {
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
  private animateTo: AnimateTo<T> | undefined = undefined
  getAnimateTo() {
    return this.animateTo
  }
  private lastCancel = emptyFun

  private clear() {
    this.lastCancel = emptyFun
    this.animateTo = undefined
  }
  slientChange(target: T, from: T = target) {
    if (this.animateTo) {
      this.animateTo.from = from
      this.animateTo.target = target
      this.animateTo.reDo()
    } else {
      this.value.set(target)
    }
  }
  changeTo(target: T, config?: AnimationConfig, {
    from,
    onProcess = emptyFun,
    onFinish = emptyFun
  }: AnimateFrameEvent<T> = emptyObject) {
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
    if (this.equal(target, baseValue)) {
      //不会发生任何改变.
      return
    }
    this.lastCancel()
    const that = this
    const animateTo = new AnimateTo(
      baseValue,
      target,
      config,
      this.mixValue,
      (v, o) => {
        that.value.set(v)
        if (o) {
          onProcess(v)
        }
      })
    this.animateTo = animateTo
    const timePeriod = performance.now()
    const cancel = subscribeRequestAnimationFrame(function (date) {
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

export function animateNumberSilientChangeDiff(n: AnimateFrameValue<number>, diff: number) {
  const ato = n.getAnimateTo()
  if (ato) {
    n.slientChange(ato.target + diff, ato.from + diff)
  } else {
    n.changeTo(n.get() + diff)
  }
}
export function animateNumberSilientChangeTo(n: AnimateFrameValue<number>, value: number) {
  const ato = n.getAnimateTo()
  if (ato) {
    n.slientChange(value, ato.from + value - ato.target)
  } else {
    n.changeTo(value)
  }
}



export const animateColorFrame = buildAnimateFrame(colorEqual, mixColor)



const numberReducer = animateFrameReducer(simpleEqual, mixNumber, requestAnimationFrame)

export type AnimateNumberFrameAction = AnimateFrameChangeTo<number> | {
  type: "silentDiff",
  value: number
} | FrameTick
export const animateNumberFrameReducer: Reducer<AnimateFrameModel<number>, AnimateNumberFrameAction> = function (old, act) {
  if (act.type == "silentDiff") {
    const diff = act.value
    if (diff != 0) {
      const value = old.value + diff
      if (old.animateTo) {
        return {
          ...old,
          value,
          animateTo: {
            ...old.animateTo,
            from: old.animateTo.from + diff,
            target: old.animateTo.target + diff
          }
        }
      }
      return {
        ...old,
        value
      }
    }
  } else {
    return numberReducer(old, act)
  }
  return old
}
export const animateColorFrameReducer = animateFrameReducer(colorEqual, mixColor, requestAnimationFrame)

