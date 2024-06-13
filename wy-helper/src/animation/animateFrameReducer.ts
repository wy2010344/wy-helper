import { ReducerDispatch, ReducerWithDispatch, SetValue } from ".."
import { arrayFunToOneOrEmpty } from '../ArrayHelper'
import { AnimationConfig, GetDeltaXAnimationConfig } from "./AnimationConfig"
export type AnimateFrameModel = {
  version: number
  value: number
  animateTo?: {
    target: number
    from: number
    config: AnimationConfig
    startTime: number
  }
}

export type AnimateFrameChangeTo = {
  type: "changeTo"
  target: number
  getConfig?: never
} | {
  type: "changeTo"
  target: number
  from?: number
  getConfig: GetDeltaXAnimationConfig
}

export type FrameTick = {
  type: "tick"
  version: number
  time: number
}


export type SilentDiff = {
  type: "silentDiff",
  value: number
}

export type SilentChange = {
  type: "silentChange",
  value: number
}

export type AnimateFrameAct = AnimateFrameChangeTo | FrameTick | SilentDiff | SilentChange
export function createAnimateFrameReducer(
  requestAnimationFrame: (v: SetValue<number>) => void
): ReducerWithDispatch<AnimateFrameModel, AnimateFrameAct> {
  type Act = AnimateFrameAct
  function buildAnimate(
    old: AnimateFrameModel,
    list: ReducerDispatch<FrameTick>[],
    oldValue: number,
    config: AnimationConfig,
    target: number
  ) {

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
        target,
        config,
        startTime: performance.now()
      }
    }
  }
  function inside(
    old: AnimateFrameModel,
    act: Act,
    list: ReducerDispatch<FrameTick>[]
  ): AnimateFrameModel {
    if (act.type == "tick") {
      if (old.animateTo && old.version == act.version) {
        const diffTime = act.time - old.animateTo.startTime
        if (diffTime > 0) {
          const c = old.animateTo.config
          const [distance, finished] = c(diffTime)
          const value = distance + old.animateTo.from
          if (finished) {
            return {
              version: old.version,
              value
            }
          } else {
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
            return {
              ...old,
              value
            }
          }
        } else {
          list.push(function (dispatch) {
            requestAnimationFrame(time => {
              dispatch({
                type: "tick",
                version: act.version,
                time
              })
            })
          })
        }
      }
    } else if (act.type == 'changeTo') {
      if (!act.getConfig) {
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
      const config = act.getConfig(act.target - oldValue)
      if (!config) {
        return {
          version: old.version,
          value: act.target
        }
      }
      return buildAnimate(old, list, oldValue, config, act.target)
    } else if (act.type == "silentDiff") {
      const diff = act.value
      const value = old.value + diff
      if (old.animateTo) {
        const oldTarget = old.animateTo.target
        return {
          ...old,
          value,
          animateTo: {
            ...old.animateTo,
            from: old.animateTo.from + diff,
            target: typeof oldTarget == 'number' ? oldTarget + diff : oldTarget
          }
        }
      }
      return {
        ...old,
        value
      }
    } else if (act.type == "silentChange") {
      if (old.animateTo) {
        const oldTarget = old.animateTo.target
        if (typeof oldTarget == 'number') {
          const diff = act.value - oldTarget
          const value = old.value + diff
          return {
            ...old,
            value,
            animateTo: {
              ...old.animateTo,
              target: act.value,
              from: old.animateTo.from + diff,
            }
          }
        } else {
          console.log("不能顺利执行silentChange,因为动画不是目标值动画")
        }
      }
      return {
        ...old,
        value: act.value
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

export function animateFrameReducerFinished(
  before: AnimateFrameModel,
  act: AnimateFrameAct,
  after: AnimateFrameModel
) {
  if (act.type == 'tick') {
    if (before.animateTo && !after.animateTo) {
      //正常结束
      return true
    }
  } else if (act.type == 'changeTo') {
    if (before.animateTo) {
      if (after.animateTo) {
        if (before.version != after.version) {
          //被新动画替换
          return 'break'
        }
      } else {
        //强制中止
        return 'break'
      }
    }
  }
}