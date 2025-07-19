
import { getOutResolvePromise, GetValue, SetValue } from "../setStateHelper";
import { createSignal } from "../signal";
import { StoreRef } from "../storeRef";
import { emptyFun } from "../util";
import { defaultSpringAnimationConfig, DeltaXSignalAnimationConfig } from "./AnimationConfig";

import { batchSignalEnd } from "../signal"
/**
 * 或者视着实例而非消息,即是可变的,只在事件中不变
 */
export function createSubscribeRequestAnimationFrame(
  requestAnimationFrame: (fun: SetValue<number>) => void,
  getNow: GetValue<number>
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
    const startTime = getNow()
    function request(time: number) {
      if (canceled) {
        return
      }
      const diffTime = time - startTime
      if (diffTime > 0 && callback(diffTime)) {
        onFinish(true)
        return
      }
      requestAnimationFrame(request)
    }
    request(0)
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
    function setDisplacement(n: number) {
      out.setDisplayment(n)
    }
    return function (diffTime) {
      return callback(diffTime, setDisplacement)
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
  ): ((diffTime: number) => any) | void
}


interface AnimateSignalResult {
  cancel(): void
  resolve(e: boolean): void
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
    const out = this.lastCancel
    if (out) {
      const target = out.out.target
      if (typeof target == 'number') {
        return target
      }
    }
    return this.get()
  }
  private value: StoreRef<number>

  private _onAnimation = createSignal<boolean>(false)
  private lastCancel: AnimateSignalResult | undefined = undefined
  private didFinish = (bool: boolean) => {
    const o = this.lastCancel
    if (o) {
      this.lastCancel = undefined
      o.cancel()
      o.resolve(bool)
      this._onAnimation.set(false)
    }
  }
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
    this.didFinish(false)
    this.value.set(n)
    return n
  }
  onAnimation = this._onAnimation.get
  silentDiff(n: number) {
    const o = this.lastCancel
    if (o) {
      o.out.silentDiff(n)
    } else {
      this.value.set(this.value.get() + n)
    }
  }

  silentChangeTo(n: number) {
    const o = this.lastCancel
    if (o) {
      o.out.silentChangeTo(n)
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
    this.didFinish(false)
    //config构造期间禁止修改
    this.lock = true

    const out = new SilentDiff(this.value, onProcess, target)
    const callback = config(out)
    this.lock = false
    if (callback) {
      const [promise, resolve] = getOutResolvePromise<boolean>()
      this._onAnimation.set(true)
      this.lastCancel = {
        cancel: this.reSubscribe(callback),
        resolve,
        out: out
      }
      return promise
    } else {
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
  stop() {
    this.set(this.get())
  }
  animateTo(
    n: number,
    config: DeltaXSignalAnimationConfig = defaultSpringAnimationConfig,
    onProcess?: SetValue<number>) {
    this.didFinish(false)
    const diff = n - this.get()
    if (diff) {
      return this.change(config(diff), onProcess, n)
    }
    return promiseImmediately
  }

  async animateThrow(
    n: number,
    config: DeltaXSignalAnimationConfig = defaultSpringAnimationConfig,
    onProcess?: SetValue<number>) {
    const out = await this.animateTo(n, config, onProcess)
    if (!out) {
      throw new Error('user cancel')
    }
    return out
  }
}



const promiseImmediately = Promise.resolve<'immediately'>('immediately')

export function createAnimateSignal(
  initValue: number,
  subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
) {
  return new AnimateSignal(initValue, subscribeRequestAnimateFrame)
}
