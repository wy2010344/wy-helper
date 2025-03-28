
import { GetValue, SetValue } from "../setStateHelper";
import { createSignal } from "../signal";
import { StoreRef } from "../storeRef";
import { emptyFun } from "../util";
import { defaultSpringAnimationConfig, DeltaXSignalAnimationConfig } from "./AnimationConfig";

import { batchSignalEnd } from "../signal"
/**
 * 或者视着实例而非消息,即是可变的,只在事件中不变
 * 第一次不处理
 */
export function createSubscribeRequestAnimationFrame(
  requestAnimationFrame: (fun: SetValue<number>) => void,
) {
  return function (
    /**返回true就是停止 */
    callback: (time: number) => any,
    /**
     * 动画结束,成功是true,外部触发是false
     */
    onFinish: SetValue<boolean> = emptyFun
  ) {
    let canceled = false
    function cancel() {
      canceled = true
      onFinish(false)
    }
    function request(time: number) {
      if (canceled) {
        return
      }
      if (callback(time)) {
        onFinish(true)
        return
      }
      requestAnimationFrame(request)
    }
    requestAnimationFrame(request)
    return cancel
  }
}

export type SubscribeRequestAnimationFrame = ReturnType<typeof createSubscribeRequestAnimationFrame>


export interface AnimationTime {
  (n: number): void
}
export function createAnimationTime(
  callback: (diffTime: number, setDisplacement: SetValue<number>) => any,
): AnimateSignalConfig {
  return function (
    out: SilentDiff
  ) {
    let startTime = performance.now()
    function setDisplacement(n: number) {
      out.setDisplayment(n)
    }
    return function (time) {
      const diffTime = time - startTime
      if (diffTime > 0) {
        return callback(diffTime, setDisplacement)
      }
    }
  }
}

export class SilentDiff {
  constructor(
    private value: StoreRef<number>,
    private onProcess?: SetValue<number>,
    readonly target?: number
  ) {
    this.initValue = value.get()
    this.getCurrent = value.get
  }
  private initValue: number
  getCurrent: GetValue<number>
  silentDiff(n: number) {
    this.initValue = this.initValue + n
    this.value.set(this.value.get() + n)
    batchSignalEnd()
  }
  silentChangeTo(n: number) {
    if (typeof this.target == 'number') {
      const diff = n - this.target
      this.silentDiff(diff)
    } else {
      throw 'not a target function'
    }
  }
  setDisplayment(n: number) {
    const nv = this.initValue + n
    this.value.set(nv)
    this.onProcess?.(nv)
  }
}



export interface AnimateSignalConfig {
  (
    value: SilentDiff
  ): ((time: number) => any) | void
}


interface AnimateSignalResult {
  cancel(): void
  out: SilentDiff
}



export class AnimateSignal {
  constructor(
    initValue: number,
    private subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
  ) {
    this.value = createSignal(initValue)
    this.get = this.value.get
  }
  get: GetValue<number>

  getTarget() {
    const out = this.lastCancel?.out
    if (out) {
      const target = out.target
      if (typeof target == 'number') {
        return target
      }
    }
    return this.get()
  }
  private value: StoreRef<number>
  lastCancel: AnimateSignalResult | void = undefined
  lastResolve: SetValue<boolean> = emptyFun
  private onFinish() {
    this.lastCancel = undefined
    this._onAnimation.set(false)
  }
  private didFinish = (bool: boolean) => {
    if (bool) {
      this.onFinish()
      this.lastResolve(true)
    }
  }
  private _onAnimation = createSignal(false)
  private lock = false
  private reSubscribe(callback: SetValue<number>) {
    return this.subscribeRequestAnimateFrame((time) => {
      this.lock = true
      const v = callback(time)
      this.lock = false
      return v
    }, this.didFinish)
  }
  set(n: number) {
    if (this.lock) {
      throw '禁止在此时修改'
    }
    if (this.lastCancel) {
      this.lastCancel.cancel()
      this.onFinish()
      this.lastResolve(false)
    }
    this.value.set(n)
  }
  onAnimation = this._onAnimation.get
  silentDiff(n: number) {
    if (this.lastCancel) {
      this.lastCancel.out.silentDiff(n)
    } else {
      this.value.set(this.value.get() + n)
    }
  }

  silentChangeTo(n: number) {
    if (this.lastCancel) {
      this.lastCancel.out.silentChangeTo(n)
    } else {
      this.value.set(n)
    }
  }

  changeDiff(n: number) {
    this.set(this.value.get() + n)
  }

  change(
    config: AnimateSignalConfig,
    onProcess?: SetValue<number>,
    target?: number
  ) {
    if (this.lock) {
      throw '禁止在此时修改'
    }
    //需要锁一下,禁止修改
    if (this.lastCancel) {
      this.lastCancel.cancel()
      this.lastResolve(false)
    }
    //config构造期间禁止修改
    this.lock = true

    const out = new SilentDiff(this.value, onProcess, target)
    const callback = config(out)
    this.lock = false
    if (callback) {
      this.lastCancel = {
        cancel: this.reSubscribe(callback),
        out: out
      }
      this._onAnimation.set(true)
      return new Promise<boolean>((resolve) => {
        this.lastResolve = resolve
      })
    } else {
      this._onAnimation.set(false)
      return promiseImmediately
    }
  }

  changeTo(
    n: number,
    config?: DeltaXSignalAnimationConfig,
    onProcess?: SetValue<number>
  ) {
    if (config) {
      return this.animateTo(n, config, onProcess)
    }
    return this.set(n)
  }
  animateTo(
    n: number,
    config: DeltaXSignalAnimationConfig = defaultSpringAnimationConfig,
    onProcess?: SetValue<number>) {
    const diff = n - this.get()
    if (diff) {
      return this.change(config(diff), onProcess, n)
    }
    return promiseImmediately
  }
}



const promiseImmediately = Promise.resolve<'immediately'>('immediately')

export function createAnimateSignal(
  initValue: number,
  subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
) {
  return new AnimateSignal(initValue, subscribeRequestAnimateFrame)
}
