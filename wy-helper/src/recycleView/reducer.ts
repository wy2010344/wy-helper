import { arrayFunToOneOrEmpty } from "../ArrayHelper"
import { ReducerWithDispatch, ReducerWithDispatchResult, mapReducerDispatch } from "../ValueCenter"
import { AnimateFrameAct, AnimateFrameModel, FrictionalFactory, GetDeltaXAnimationConfig } from "../animation"

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

export function getIdxWith(diff: number, rowHeight: number) {
  // let idx = 0
  // if (diff >= rowHeight) {
  //   // idx = -Math.ceil(diff / rowHeight)
  //   // idx = -Math.floor(diff / rowHeight)
  //   idx = -Math.round(diff / rowHeight)
  // } else if (diff <= -rowHeight) {
  //   // idx = -Math.floor(diff / rowHeight)
  //   //后面两个步进都是1,第1个步进是2,即1.1时就进2准备着,可以减少空白
  //   // idx = -Math.ceil(diff / rowHeight)
  //   idx = -Math.round(diff / rowHeight)
  // }
  // return idx
  /**因为浮点误差,用四舍去五入最合适 */
  return -Math.round(diff / rowHeight)
}
export function createRecycleScrollListReducer(
  animateNumberFrameReducer: ReducerWithDispatch<AnimateFrameModel, AnimateFrameAct>
): ReducerWithDispatch<RecycleListModel, RecycleScrollAction> {
  function aUpdate(value: number, model: RecycleListModel): RecycleListModel {
    const diff = value - model.initTransY
    const idx = getIdxWith(diff, model.cellHeight)
    if (idx) {
      const [transY] = animateNumberFrameReducer(model.transY, {
        type: "silentDiff",
        value: idx * model.cellHeight
      })
      return {
        ...model,
        index: formatIndex(model.index + idx, model.size),
        transY
      }
    }
    return model
  }

  function updateIndex(
    model: RecycleListModel,
    idx: number,
    getConfig: GetDeltaXAnimationConfig
  ): RecycleResult {
    // const animateToTarget = model.transY.animateTo?.target
    // let from = model.transY.value
    // if (typeof animateToTarget == 'number') {
    //   model = aUpdate(animateToTarget, model)
    //   from = animateToTarget
    // }
    const [transY, act] = animateNumberFrameReducer(model.transY, {
      type: "changeTo",
      // from,
      target: model.initTransY + idx * model.cellHeight,
      getConfig
    })
    return [{
      ...model,
      transY
    }, mapReducerDispatch(act, transNumberToScrollView)]
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
      const toValue = action.diff + model.transY.value
      return [aUpdate(toValue, {
        ...model,
        transY: {
          version: model.transY.version,
          value: toValue
        }
      })]
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
        const value = aUpdate(newTransY.value, newModel)
        return [value, theAct]
      }
      return [newModel, theAct]
    }
    return [model, undefined]
  }
}