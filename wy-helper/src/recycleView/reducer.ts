import { arrayFunToOneOrEmpty } from "../ArrayHelper"
import { ReducerWithDispatch, ReducerWithDispatchResult, mapReducerDispatch } from "../ValueCenter"
import { AnimateFrameAct, AnimateFrameModel, AnimationConfig, GetDeltaXAnimationConfig } from "../animation"

export type RecycleListModel = {
  size: number
  cellHeight: number
  initTransY: number
  transY: AnimateFrameModel
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

type RecycleResult = ReducerWithDispatchResult<RecycleListModel, RecycleScrollAction>


function transNumberToScrollView(value: AnimateFrameAct): RecycleScrollAction {
  return {
    type: "changeTransY",
    value
  }
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

export type RecycleScrollAction = {
  type: "init"
  transY: number
  size: number
  cellHeight: number
} | {
  type: "addIndex",
  value: number
  getConfig?: never
} | {
  value: number
  type: "addIndex"
  getConfig: GetDeltaXAnimationConfig
} | {
  type: "changeDiff"
  diff: number
} | {
  type: "changeTransY"
  value: AnimateFrameAct
} | {
  type: "endMove",
  idealDistance: number,
  /**
   * @todo config提升到全局,别的index改变也用这个.
   * @param distance 
   */
  getConfig: GetDeltaXAnimationConfig
}

export function createRecycleScrollListReducer(
  animateNumberFrameReducer: ReducerWithDispatch<AnimateFrameModel, AnimateFrameAct>
): ReducerWithDispatch<RecycleListModel, RecycleScrollAction> {
  function updateIndex(
    model: RecycleListModel,
    idx: number,
    getConfig: GetDeltaXAnimationConfig
  ): RecycleResult {
    let nValue = model.initTransY + idx * model.cellHeight
    const [transY, act] = animateNumberFrameReducer(model.transY, {
      type: "changeTo",
      target: nValue,
      getConfig
    })
    return [{
      ...model,
      transY
    }, mapReducerDispatch(act, transNumberToScrollView)]
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
  return (model, action) => {
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
      if (action.getConfig) {
        return updateIndex(model, -action.value, action.getConfig)
      }
      return [{
        ...model,
        index: formatIndex(action.value + model.index, model.size)
      }, undefined]
    } else if (action.type == "changeDiff") {
      const diff = action.diff + model.transY.value - model.initTransY
      return updateDiff(diff, {
        ...model,
        transY: {
          version: model.transY.version,
          value: diff + model.initTransY
        }
      })
    } else if (action.type == 'endMove') {
      const value = Math.round(action.idealDistance + model.transY.value - model.initTransY)
      const idx = Math.round(value / model.cellHeight)
      return updateIndex(model, idx, action.getConfig)
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
}