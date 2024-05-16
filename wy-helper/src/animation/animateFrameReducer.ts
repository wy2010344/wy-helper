import { AnimationConfig, ReducerDispatch, ReducerWithDispatch, SetValue } from ".."
import { arrayFunToOneOrEmpty } from '../ArrayHelper'
import { mixNumber } from '../NumberHelper'
export type AnimateFrameModel = {
  version: number
  value: number
  animateTo?: {
    from: number
    target: number
    config: AnimationConfig
    startTime: number
  }
}

export type AnimateFrameChangeTo = {
  type: "changeTo"
  target: number
  config?: never
} | {
  type: "changeTo"
  target: number
  from?: number
  config: AnimationConfig
}

export type FrameTick = {
  type: "tick"
  version: number
  time: number
}


export type SilentChange = {
  type: "silentDiff",
  value: number
}

export type AnimateFrameAct = AnimateFrameChangeTo | FrameTick | SilentChange
export function animateFrameReducer(
  requestAnimationFrame: (v: SetValue<number>) => void
): ReducerWithDispatch<AnimateFrameModel, AnimateFrameAct> {
  type Act = AnimateFrameAct
  function inside(
    old: AnimateFrameModel,
    act: Act,
    list: ReducerDispatch<FrameTick>[]
  ): AnimateFrameModel {
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
            const value = mixNumber(
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
        if (old.value == act.target && !old.animateTo) {
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
      if (oldValue == act.target) {
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
    } else if (act.type == "silentDiff") {
      const diff = act.value
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
    return old
  }
  return function (old, act) {
    const list: ReducerDispatch<FrameTick>[] = []
    const value = inside(old, act, list)
    return [value, arrayFunToOneOrEmpty(list)] as const
  }
}