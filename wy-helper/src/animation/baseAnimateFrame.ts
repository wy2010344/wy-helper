import { GetValue, SetValue } from "../setStateHelper";
import { createSignal } from "../signal";
import { StoreRef } from "../storeRef";
import { emptyFun } from "../util";
import { SilentDiff, SubscribeRequestAnimationFrame } from "./animateFrame";
import { defaultSpringAnimationConfig, DeltaXSignalAnimationConfig } from "./AnimationConfig";

export interface AnimateSignalConfig {
  (
    value: StoreRef<number>
  ): {
    out: SilentDiff,
    callback(time: number): any
  } | void
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

  changeDiff(n: number) {
    this.set(this.value.get() + n)
  }

  silentChangeTo(n: number) {
    const diff = n - this.value.get()
    this.silentDiff(diff)
  }
  change(
    config: AnimateSignalConfig,
    onProcess?: SetValue<number>
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
    const out = config(
      onProcess ? {
        get: this.value.get,
        set: (v) => {
          this.value.set(v)
          onProcess(v)
        },
      } : this.value)
    this.lock = false
    if (out) {
      this.lastCancel = {
        cancel: this.reSubscribe(out.callback),
        out: out.out
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
  animateTo(n: number,
    config: DeltaXSignalAnimationConfig = defaultSpringAnimationConfig,
    onProcess?: SetValue<number>) {
    const diff = n - this.get()
    if (diff) {
      return this.change(config(diff), onProcess)
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
