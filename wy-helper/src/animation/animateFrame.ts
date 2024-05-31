import { AnimationConfig, GetDeltaXAnimationConfig } from "./AnimationConfig"
import { ReadValueCenter, ValueCenter, valueCenterOf } from "../ValueCenter"
import { SetValue } from "../setStateHelper"
import { emptyFun, emptyObject } from '../util'
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




export type AnimateFrameEvent = {
  from?: number
  onProcess?(v: number): void
  onFinish?(v: boolean): void
}

export interface AnimateTo {
  from: number,
  hasTarget(): this is AnimateToImplE
  config: AnimationConfig
}

type AnimateSetValue = (v: number, onProcess?: boolean) => void
class AnimateToImpl implements AnimateTo {
  constructor(
    public from: number,
    public config: AnimationConfig,
    private setValue: AnimateSetValue
  ) { }
  private time: number = 0
  update(diffTime: number, onProcess?: boolean) {
    this.time = diffTime
    const out = this.config(diffTime)
    const value = out[0]
    this.setValue(this.from + value, onProcess)
    return out[1]
  }
  reDo() {
    this.update(this.time)
  }
  hasTarget(): this is AnimateToImplE {
    return false
  }
}
class AnimateToImplE extends AnimateToImpl {
  constructor(
    public target: number,
    from: number,
    config: AnimationConfig,
    setValue: (v: number, onProcess?: boolean) => void
  ) {
    super(from, config, setValue)
  }
  hasTarget(): this is AnimateToImplE {
    return true
  }
}

export interface AnimateFrameValue extends ReadValueCenter<number> {
  slientDiff(n: number): void
  getAnimateTo(): AnimateTo | undefined
  getAnimateToTarget(): number | undefined
  changeTo(target: number, getConfig?: GetDeltaXAnimationConfig, ext?: AnimateFrameEvent): "immediately" | "animate" | undefined
}
/**
 * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
 * 或者总是使用flushSync.
 */
export class AnimateFrameValueImpl implements AnimateFrameValue {
  private value: ValueCenter<number>
  constructor(
    initValue: number,
    private requestAnimateFrame: (fun: SetValue<number>) => void,
  ) {
    this.value = valueCenterOf(initValue)
  }
  /**
   * 如果正在发生动画,这个值存在
   */
  private animateTo: AnimateToImpl | undefined = undefined
  getAnimateTo() {
    return this.animateTo
  }

  getAnimateToTarget() {
    if (this.animateTo instanceof AnimateToImplE) {
      return this.animateTo.target
    }
  }

  private lastCancel = emptyFun

  private clear() {
    this.lastCancel = emptyFun
    this.animateTo = undefined
  }
  slientChange(target: number, from?: number) {
    if (this.animateTo) {
      if (this.animateTo instanceof AnimateToImplE) {
        this.animateTo.from = typeof from == 'number'
          ? from
          : this.animateTo.from + target - this.animateTo.target
        this.animateTo.target = target
        this.animateTo.reDo()
        return true
      } else {
        return false
      }
    } else {
      this.value.set(target)
      return true
    }
  }
  slientDiff(diff: number) {
    if (this.animateTo) {
      this.animateTo.from = this.animateTo.from + diff
      if (this.animateTo instanceof AnimateToImplE) {
        this.animateTo.target = this.animateTo.target + diff
      }
      this.animateTo.reDo()
    } else {
      this.value.set(this.value.get() + diff)
    }
  }
  setAnimate(config: AnimationConfig, {
    from,
    onProcess = emptyFun,
    onFinish = emptyFun
  }: AnimateFrameEvent = emptyObject) {
    const { setValue, baseValue, needReset } = this.initConfig(from, onProcess)
    const animateTo = new AnimateToImpl(
      baseValue,
      config,
      setValue)
    this.beginAnimate(animateTo, needReset, onFinish)
  }
  changeTo(target: number, getConfig?: GetDeltaXAnimationConfig, {
    from,
    onProcess = emptyFun,
    onFinish = emptyFun
  }: AnimateFrameEvent = emptyObject) {
    if (!getConfig) {
      //中止动画
      this.lastCancel()
      this.value.set(target)
      return 'immediately'
    }
    const { setValue, baseValue, needReset } = this.initConfig(from, onProcess)
    const config = getConfig(target - baseValue)
    if (!config) {
      //超越检测动画
      this.value.set(target)
      return 'immediately'
    }
    const animateTo = new AnimateToImplE(
      target,
      baseValue,
      config,
      setValue)
    this.beginAnimate(animateTo, needReset, onFinish)
    return 'animate'
  }

  private initConfig(from: number | undefined, onProcess: SetValue<number>) {
    const that = this
    let needReset = false
    let baseValue = 0
    if (typeof from != 'undefined') {
      needReset = true
      baseValue = from
    } else {
      baseValue = this.value.get()
    }
    this.lastCancel()
    const setValue: AnimateSetValue = (v, o) => {
      that.value.set(v)
      if (o) {
        onProcess(v)
      }
    }
    return {
      setValue,
      needReset,
      baseValue
    }
  }
  private beginAnimate(animateTo: AnimateToImpl, needReset: boolean, onFinish: SetValue<boolean>) {
    const that = this
    this.animateTo = animateTo
    const timePeriod = performance.now()
    if (needReset) {
      animateTo.reDo()
    }
    const cancel = superSubscribeRequestAnimationFrame(
      this.requestAnimateFrame,
      function (date) {
        const diffTime = date - timePeriod
        if (diffTime > 0) {
          const finished = animateTo.update(diffTime, true)
          if (finished) {
            cancel()
            that.clear()
            //在trigger里访问到animateTo已经结束
            onFinish(true)
          }
        }
      })
    this.lastCancel = function () {
      cancel()
      that.clear()
      //在trigger里访问到animateTo已经结束
      onFinish(false)
    }
  }
  get() {
    return this.value.get()
  }
  subscribe(fun: SetValue<number>) {
    return this.value.subscribe(fun)
  }
}