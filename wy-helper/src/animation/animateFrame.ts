import { AnimationConfig, defaultSpringBaseAnimationConfig, GetDeltaXAnimationConfig } from "./AnimationConfig"
import { GetValue, SetValue } from "../setStateHelper"
import { EmptyFun, emptyFun, emptyObject } from '../util'
import { ReadValueCenter, ValueCenter, valueCenterOf } from "../ValueCenter"
import { StoreRef } from "../storeRef"
import { addEffect, batchSignalEnd, createSignal, signalOnUpdate } from "../signal"
/**
 * 或者视着实例而非消息,即是可变的,只在事件中不变
 */
export type AnimationFrameArg = {
  isInit: boolean,
  cancel: EmptyFun
}
export function superSubscribeRequestAnimationFrame(
  requestAnimationFrame: (fun: SetValue<number>) => void,
  callback: (time: number, arg: AnimationFrameArg) => void,
  init?: boolean
) {
  let canceled = false
  function cancel() {
    canceled = true
  }
  const req = { isInit: false, cancel }
  function request(time: number) {
    if (canceled) {
      return
    }
    callback(time, req)
    if (canceled) {
      return
    }
    requestAnimationFrame(request)
  }
  if (init) {
    callback(performance.now(), { isInit: true, cancel })
  }
  requestAnimationFrame(request)
  return cancel
}




export type AnimateFrameEvent = {
  from?: number
  onProcess?(v: number): void
  onFinish?(v: boolean): void
}

export interface AnimateConfig {
  target: number
  from: number,
  config: AnimationConfig
}

type AnimateSetValue = (v: number, onProcess?: boolean) => void
class AnimateToImpl implements AnimateConfig {
  constructor(
    public from: number,
    public target: number,
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
}
/**
 * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
 * 或者总是使用flushSync.
 */
export class AbsAnimateFrameValue {
  constructor(
    public readonly get: GetValue<number>,
    private set: SetValue<number>,
    private trySet: SetValue<number>,
    private requestAnimateFrame: (fun: SetValue<number>) => void,
    private eachCommit = emptyFun
  ) {
  }
  /**
   * 如果正在发生动画,这个值存在
   */
  private animateConfig: AnimateToImpl | undefined = undefined

  protected setAnimateConfig(v?: AnimateToImpl) {
    this.animateConfig = v
  }
  getAnimateConfig() {
    return this.animateConfig
  }
  getTargetValue(): number {
    if (this.animateConfig) {
      return this.animateConfig.target
    }
    return this.get()
  }

  private lastCancel = emptyFun

  private clear() {
    this.lastCancel = emptyFun
    this.setAnimateConfig()
  }
  slientChange(target: number) {
    if (this.animateConfig) {
      this.animateConfig.from = this.animateConfig.from + target - this.animateConfig.target
      this.animateConfig.target = target
      this.animateConfig.reDo()
    } else {
      this.set(target)
      return true
    }
  }
  changeDiff(diff: number, getConfig?: GetDeltaXAnimationConfig, event: Omit<AnimateFrameEvent, 'from'> = emptyObject) {
    return this.changeTo(this.get() + diff, getConfig, event)
  }
  slientDiff(diff: number) {
    if (this.animateConfig) {
      this.animateConfig.from = this.animateConfig.from + diff
      this.animateConfig.target = this.animateConfig.target + diff
      this.animateConfig.reDo()
    } else {
      this.set(this.get() + diff)
    }
  }
  animateTo(
    target: number,
    config: GetDeltaXAnimationConfig = defaultSpringBaseAnimationConfig,
    c: {
      from?: number,
      onProcess?: EmptyFun
    } = emptyObject) {
    const from = c.from || this.get()
    if (from != target) {
      return new Promise<boolean>(resolve => {
        this.changeTo(target, config, {
          from: c.from,
          onProcess: c.onProcess,
          onFinish: resolve
        })
      })
    }
  }
  changeTo(target: number, getConfig?: GetDeltaXAnimationConfig, {
    from,
    onProcess = emptyFun,
    onFinish = emptyFun
  }: AnimateFrameEvent = emptyObject) {
    if (!getConfig) {
      //中止动画
      this.lastCancel()
      this.set(target)
      return 'immediately'
    }
    const { setValue, baseValue, needReset } = this.initConfig(from, onProcess)
    const config = getConfig(target - baseValue)
    if (!config) {
      //超越检测动画
      this.set(target)
      onFinish(true)
      return 'immediately'
    }
    const animateTo = new AnimateToImpl(
      baseValue,
      target,
      config,
      setValue)
    this.beginAnimate(animateTo, needReset, onFinish)
    return 'animate'
  }

  stop() {
    if (this.animateConfig) {
      this.changeTo(this.get())
    }
  }
  private initConfig(from: number | undefined, onProcess: SetValue<number>) {
    const that = this
    let needReset = false
    let baseValue = 0
    if (typeof from != 'undefined') {
      needReset = true
      baseValue = from
    } else {
      baseValue = this.get()
    }
    this.lastCancel()
    const setValue: AnimateSetValue = (v, o) => {
      that.trySet(v)
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
  private beginAnimate(
    animateTo: AnimateToImpl,
    needReset: boolean,
    onFinish: SetValue<boolean>
  ) {
    const that = this
    this.setAnimateConfig(animateTo)
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
          that.eachCommit()
        }
      })
    this.lastCancel = function () {
      cancel()
      that.clear()
      //在trigger里访问到animateTo已经结束
      onFinish(false)
    }
  }
}

export class AnimateFrameValue extends AbsAnimateFrameValue implements ReadValueCenter<number> {
  private valueCenter: ValueCenter<number>
  constructor(
    value: number,
    requestAnimateFrame: (fun: SetValue<number>) => void
  ) {
    const valueCenter = valueCenterOf(value)
    const set = valueCenter.set.bind(valueCenter)
    super(
      valueCenter.get.bind(valueCenter),
      set,
      set,
      requestAnimateFrame
    )
    this.valueCenter = valueCenter
  }
  subscribe(notify: (v: number, old: number) => void): EmptyFun {
    return this.valueCenter.subscribe(notify)
  }
}


export class SignalAnimateFrameValue extends AbsAnimateFrameValue {
  constructor(
    value: number,
    requestAnimateFrame: (fun: SetValue<number>) => void,
    eachCommit?: EmptyFun
  ) {
    const signal = createSignal(value)
    super(
      signal.get,
      signal.set,
      function (v) {
        if (signalOnUpdate()) {
          addEffect(() => {
            signal.set(v)
            batchSignalEnd()
          })
        } else {
          signal.set(v)
        }
      },
      requestAnimateFrame,
      eachCommit
    )
  }
  private onAnimate = createSignal(false)
  protected setAnimateConfig(v?: AnimateToImpl): void {
    super.setAnimateConfig(v)
    this.onAnimate.set(Boolean(v))
  }
  getAnimateConfig(): AnimateToImpl | undefined {
    //使其可观察
    this.onAnimate.get()
    return super.getAnimateConfig()
  }
}