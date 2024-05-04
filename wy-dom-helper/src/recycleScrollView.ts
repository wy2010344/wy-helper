import { AnimateFrameModel, AnimationConfig, EaseFn, EmptyFun, FrameTick, MomentumCallIdeal, Reducer, ReducerDispatch, ReducerWithDispatch, ReducerWithDispatchResult, SetValue, arrayFunToOneOrEmpty, buildNoEdgeScroll, emptyArray, emptyFun, mapReducerDispatch, mapReducerDispatchList } from "wy-helper";
import { AnimateFrameEvent, AnimateNumberFrameAction, animateNumberFrame, animateNumberFrameReducer, animateNumberSilientChangeDiff } from "./animation";





export function recicleScrollViewView(
  flushSync: (fun: EmptyFun) => void,
  addIndex: (n: number) => void,
  rowHeight: number,
  momentum: MomentumCallIdeal,
  scrollFn: EaseFn,
  transY = animateNumberFrame(0)
) {
  let initScrollHeight = 0
  function diffUpdate(diff: number) {
    let idx = 0
    if (diff >= rowHeight) {
      idx = -Math.floor(diff / rowHeight)
    } else if (diff <= -rowHeight) {
      idx = -Math.ceil(diff / rowHeight)
    }
    if (idx) {
      animateNumberSilientChangeDiff(transY, idx * rowHeight)
      flushSync(() => {
        addIndex(idx)
      })
    }
  }
  function aUpdate(value: number) {
    diffUpdate(value - initScrollHeight)
  }
  return {
    trans: transY,
    setInitScrollHeight(n: number) {
      initScrollHeight = n
      transY.changeTo(n)
    },
    scroll: buildNoEdgeScroll({
      changeDiff(diff, duration) {
        const value = transY.get() + diff - initScrollHeight
        if (typeof duration == 'number') {
          const idx = Math.round(value / rowHeight)
          let nValue = initScrollHeight + idx * rowHeight

          transY.changeTo(nValue, {
            duration,
            fn: scrollFn
          }, {
            onProcess: aUpdate,
            onFinish(v) {
              if (v) {
                aUpdate(transY.get())
              }
            },
          })
        } else {
          transY.changeTo(value + initScrollHeight)
          diffUpdate(value)
        }
      },
      momentum
    }),
    stopScroll(toCurrent?: boolean) {
      const ato = transY.getAnimateTo()
      if (ato) {
        let nValue = ato.target
        if (toCurrent) {
          const v = transY.get() - initScrollHeight
          const idx = Math.round(v / rowHeight)
          nValue = idx * rowHeight + initScrollHeight
        }
        transY.changeTo(nValue)
        aUpdate(nValue)
      }
    },
    wrapperAdd(n: number, config?: AnimationConfig, event?: AnimateFrameEvent<number>) {
      if (n) {
        if (transY.getAnimateTo() || !config) {
          addIndex(n)
        } else {
          transY.changeTo(initScrollHeight, config, {
            ...event,
            from: initScrollHeight + n * rowHeight
          })
          flushSync(() => {
            addIndex(n)
          })
        }
      }
    }
  }
}





export type RecycleListModel = {
  size: number
  cellHeight: number
  initTransY: number
  transY: AnimateFrameModel<number>
  index: number
}

export const initRecycleListModel: RecycleListModel = {
  size: 0,
  cellHeight: 0,
  initTransY: 0,
  transY: {
    value: 0,
    version: 0
  },
  index: 0
}

type RecycleResult = ReducerWithDispatchResult<RecycleListModel, Action>


function transNumberToScrollView(value: AnimateNumberFrameAction): Action {
  return {
    type: "changeTransY",
    value
  }
}

function updateDiff(diff: number, model: RecycleListModel): RecycleResult {
  let idx = 0
  if (diff >= model.cellHeight) {
    idx = -Math.floor(diff / model.cellHeight)
  } else if (diff <= -model.cellHeight) {
    idx = -Math.ceil(diff / model.cellHeight)
  }
  if (idx) {
    const [transY, act] = animateNumberFrameReducer(model.transY, {
      type: "silentDiff",
      value: idx * model.cellHeight
    })
    return [{
      ...model,
      index: formatIndex(model.index + idx, model.size),
      transY
    },
    mapReducerDispatch(act, transNumberToScrollView)]
  }
  return [model, undefined]
}


function formatIndex(newIndex: number, size: number) {
  while (newIndex < 0) {
    newIndex = newIndex + size
  }
  while (newIndex >= size) {
    newIndex = newIndex - size
  }
  return newIndex
}

function updateIndex(model: RecycleListModel, idx: number, config: AnimationConfig): RecycleResult {
  let nValue = model.initTransY + idx * model.cellHeight
  const [transY, act] = animateNumberFrameReducer(model.transY, {
    type: "changeTo",
    target: nValue,
    config
  })
  return [{
    ...model,
    transY
  }, mapReducerDispatch(act, transNumberToScrollView)]
}
/**
 (value) {
        dispatch({
          type: "changeTransY",
          value
        })
      }
 */
type Action = {
  type: "init"
  transY: number
  size: number
  cellHeight: number
} | {
  type: "addIndex",
  value: number
  config?: never
  dispatch?: never
} | {
  value: number
  type: "addIndex"
  config: AnimationConfig
} | {
  type: "changeDiff"
  diff: number
  config?: AnimationConfig
} | {
  type: "changeTransY"
  value: AnimateNumberFrameAction
}
export const recycleScrollListReducer: ReducerWithDispatch<RecycleListModel, Action> = (model, action) => {
  if (action.type == 'init') {
    return [{
      ...model,
      initTransY: action.transY,
      transY: {
        ...model.transY,
        value: action.transY
      },
      cellHeight: action.cellHeight,
      size: action.size
    }, undefined]
  } else if (action.type == "addIndex") {
    if (action.config) {
      return updateIndex(model, -action.value, action.config)
    }
    return [{
      ...model,
      index: formatIndex(action.value + model.index, model.size)
    }, undefined]
  } else if (action.type == "changeDiff") {
    const diff = action.diff + model.transY.value - model.initTransY
    if (action.config) {
      const idx = Math.round(diff / model.cellHeight)
      return updateIndex(model, idx, action.config)
    } else {
      return updateDiff(diff, {
        ...model,
        transY: {
          version: model.transY.version,
          value: diff + model.initTransY
        }
      })
    }
  } else if (action.type == "changeTransY") {
    const value = action.value
    const [newTransY, act] = animateNumberFrameReducer(model.transY, value)
    const newModel = {
      ...model,
      transY: newTransY
    }
    const theAct = mapReducerDispatch(act, transNumberToScrollView)
    if (value.type == "tick" && newTransY.value != model.transY.value) {
      const diff = newTransY.value - model.initTransY
      const [value, nAct] = updateDiff(diff, newModel)
      return [value, arrayFunToOneOrEmpty([theAct, nAct])]
    }
    return [newModel, theAct]
  }
  return [model, undefined]
}