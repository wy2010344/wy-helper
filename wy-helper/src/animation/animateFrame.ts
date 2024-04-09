import { AnimationConfig, Reducer, SetValue, emptyFun } from ".."
class Tick {
  constructor(
    public readonly version: number,
    public readonly time: number
  ) { }
}

export type AnimateFrameModel<T> = {
  version: number
  value: T
  animateTo?: {
    from: T
    target: T
    config: AnimationConfig
    startTime: number
    /**感觉不是很必要!!!!*/
    onFinish(v: boolean): void
    onProcess(v: T): void
  }
}

export type AnimateFrameChangeTo<T> = {
  type: "changeTo"
  target: T
  config?: never
} | {
  type: "changeTo"
  target: T
  from?: T
  config: AnimationConfig
  onFinish?(v: boolean): void
  onProcess?(v: T): void
}
export function animateFrameReducer<T>(
  equal: (a: T, b: T) => any,
  /**
   * 取百分比
   */
  mixValue: (a: T, b: T, c: number) => T,
  requestAnimationFrame: (v: SetValue<number>) => void
): Reducer<AnimateFrameModel<T>, AnimateFrameChangeTo<T>> {
  type Act = AnimateFrameChangeTo<T> | Tick
  return function (
    old: AnimateFrameModel<T>,
    act: Act,
    dispatch: SetValue<Act>
  ): AnimateFrameModel<T> {
    if (act instanceof Tick) {
      if (old.animateTo && old.version == act.version) {
        const diffTime = act.time - old.animateTo.startTime
        const c = old.animateTo.config
        if (diffTime < c.duration) {
          //正常触发动画
          requestAnimationFrame(time => {
            dispatch(new Tick(act.version, time))
          })
          if (diffTime > 0) {
            const value = mixValue(
              old.animateTo.from,
              old.animateTo.target,
              c.fn(diffTime / c.duration)
            )
            old.animateTo.onProcess(value)
            return {
              ...old,
              value
            }
          }
        } else {
          //结束
          old.animateTo.onFinish(true)
          return {
            version: old.version,
            value: old.animateTo.target
          }
        }
      }
    } else if (act.type == 'changeTo') {
      if (!act.config) {
        if (equal(old.value, act.target) && !old.animateTo) {
          //不改变
          return old
        }
        //替换
        old.animateTo?.onFinish(false)
        return {
          version: old.version,
          value: act.target
        }
      }
      let oldValue = old.value
      if (typeof act.from != 'undefined') {
        oldValue = act.from
      }
      if (equal(oldValue, act.target)) {
        //不改变
        return old
      }
      const version = old.version + 1
      requestAnimationFrame(time => {
        dispatch(new Tick(version, time))
      })
      old.animateTo?.onFinish(false)
      return {
        version,
        value: oldValue,
        animateTo: {
          from: oldValue,
          target: act.target,
          config: act.config,
          startTime: performance.now(),
          onFinish: act.onFinish || emptyFun,
          onProcess: act.onProcess || emptyFun
        }
      }
    }
    return old
  } as any
}

