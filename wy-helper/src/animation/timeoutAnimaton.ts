import { simpleEqual } from ".."
import { ReadValueCenter, Subscriber, ValueCenter, valueCenterOf } from "../ValueCenter"
import { SetValue } from "../setStateHelper"
import { emptyFun } from "../util"


export type TimeoutAnimateConfig<F> = {
  value: F
  duration: number
}
export type TimeoutAnimateData<T, F> = {
  value: T,
  config?: TimeoutAnimateConfig<F>
}

export function singleTimeoutCallback() {
  let lastTimeOut: NodeJS.Timeout | undefined = undefined
  let lastOnFinish = emptyFun

  return function (duration: number, onFinish?: SetValue<boolean>) {
    if (lastTimeOut) {
      clearTimeout(lastTimeOut)
      lastTimeOut = undefined

      const fun = lastOnFinish
      lastOnFinish = emptyFun
      fun(false)
    }
    if (duration && onFinish) {
      lastOnFinish = onFinish
      lastTimeOut = setTimeout(() => {
        lastTimeOut = undefined

        lastOnFinish = emptyFun
        onFinish!(true)
      }, duration)
    }
  }
}
/**
 * 这个是非常实用的,主要是精确定位了动画结束事件:是提前终止还是正常结束
 */
export class TimeoutAnimate<T, F> implements ReadValueCenter<TimeoutAnimateData<T, F>>{
  private center: ValueCenter<TimeoutAnimateData<T, F>>
  constructor(
    value: T,
    private equal: (a: T, b: T) => any = simpleEqual
  ) {
    this.center = valueCenterOf({
      value
    })
    this.subscribe = this.subscribe.bind(this)
  }
  private timeoutCB = singleTimeoutCallback()
  changeTo(value: T, config?: TimeoutAnimateConfig<F>, onFinish?: (v: boolean) => void) {
    if (!this.equal(this.center.get().value, value) || !config?.duration) {
      const thisValue = {
        value,
        config
      }
      this.center.set(thisValue)
      this.timeoutCB(config?.duration || 0, (bool) => {
        if (bool) {
          if (thisValue == this.center.get()) {
            //如果仍然匹配得上,直接改
            this.center.set({
              value
            })
          }
        }
        onFinish?.(bool)
      })
      return true
    }
    return false
  }
  get() {
    return this.center.get()
  }
  subscribe(callback: (v: TimeoutAnimateData<T, F>) => void) {
    return this.center.subscribe(callback)
  }
}
