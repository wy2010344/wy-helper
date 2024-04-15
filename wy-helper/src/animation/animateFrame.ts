import { AnimationConfig, ReducerDispatch, ReducerWithDispatch, SetValue } from ".."
import { arrayFunToOneOrEmpty } from '../ArrayHelper'
export type AnimateFrameModel<T> = {
  version: number
  value: T
  animateTo?: {
    from: T
    target: T
    config: AnimationConfig
    startTime: number
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
}

export type FrameTick = {
  type: "tick"
  version: number
  time: number
}

export function animateFrameReducer<T>(
  equal: (a: T, b: T) => any,
  /**
   * 取百分比
   */
  mixValue: (a: T, b: T, c: number) => T,
  requestAnimationFrame: (v: SetValue<number>) => void
): ReducerWithDispatch<AnimateFrameModel<T>, AnimateFrameChangeTo<T> | FrameTick> {
  type Act = AnimateFrameChangeTo<T> | FrameTick
  function inside(
    old: AnimateFrameModel<T>,
    act: Act,
    list: ReducerDispatch<FrameTick>[]
  ): AnimateFrameModel<T> {
    if (act.type == "tick") {
      if (old.animateTo && old.version == act.version) {
        const diffTime = act.time - old.animateTo.startTime
        const c = old.animateTo.config
        if (diffTime < c.duration) {
          //正常触发动画
          list.push(function (dispatch) {
            requestAnimationFrame(time => {
              dispatch({
                type: "tick",
                version: act.version,
                time
              })
            })
          })
          if (diffTime > 0) {
            const value = mixValue(
              old.animateTo.from,
              old.animateTo.target,
              c.fn(diffTime / c.duration)
            )
            return {
              ...old,
              value
            }
          }
        } else {
          //结束
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
      list.push(function (dispatch) {
        requestAnimationFrame(time => {
          dispatch({
            type: "tick",
            version,
            time
          })
        })
      })
      return {
        version,
        value: oldValue,
        animateTo: {
          from: oldValue,
          target: act.target,
          config: act.config,
          startTime: performance.now()
        }
      }
    }
    return old
  }
  return function (old, act) {
    const list: ReducerDispatch<FrameTick>[] = []
    const value = inside(old, act, list)
    return [value, arrayFunToOneOrEmpty(list)] as const
  }
}

