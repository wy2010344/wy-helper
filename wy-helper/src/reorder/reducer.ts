import { arrayMove } from "../ArrayHelper"
import { ReducerDispatch, ReducerWithDispatch, ReducerWithDispatchResult, mapReducerDispatchListA } from "../ValueCenter"
import { AnimateFrameAct, AnimateFrameModel, AnimationConfig } from "../animation"
import { reorderCheckTarget } from "./util"
export type ReorderModelRow<T> = {
  transY: AnimateFrameModel
  value: T
}
export type ReorderModel<T, K> = {
  onMove?: {
    key: K
    info?: {
      beginPoint: number
      lastPoint: number
    },
    endAt?: {
      point: number
      lastPoint: number
    }
  }
  scrollTop: number
  /**
   * 主要是render延迟生效,拖拽移动已触发调整,但版本还是旧的.
   */
  version: number
  gap: number
  list: ReorderModelRow<T>[]
}


export type ReorderAction<K, E> = {
  type: "moveBegin"
  key: K
  point: number
  scrollTop: number
} | {
  //在滚动的时候,也使用这个
  type: "didMove"
  version: number
  point: number
  gap?: number
  elements: ReorderElement<K, E>[]
  scrollTop: number
} | {
  type: "end",
  point: number
  version: number
  gap?: number
  elements: ReorderElement<K, E>[]
  scrollTop: number
  config: AnimationConfig
} | {
  type: "didEnd",
  gap?: number
  scrollTop: number
  elements: ReorderElement<K, E>[]
  config: AnimationConfig
} | {
  type: "changeY"
  key: K
  value: AnimateFrameAct
}

export type ReorderElement<K, E> = {
  key: K,
  div: E
}


function rangeBetweenLeft(idx: number, idx1: number, callback: (i: number) => void) {
  if (idx < idx1) {
    for (let i = idx; i < idx1; i++) {
      callback(i)
    }
  } else {
    for (let i = idx; i > idx1; i--) {
      callback(i)
    }
  }
}
function rangeBetweenRight(idx: number, idx1: number, callback: (i: number) => void) {
  if (idx < idx1) {
    for (let i = idx; i < idx1; i++) {
      callback(i + 1)
    }
  } else {
    for (let i = idx; i > idx1; i--) {
      callback(i - 1)
    }
  }
}

class MergeAction<K> {
  onMoveList: {
    key: K,
    value: ReducerDispatch<AnimateFrameAct>
  }[] = []
  append(index: K, v: ReducerDispatch<AnimateFrameAct>) {
    this.onMoveList.push({
      key: index,
      value: v
    })
  }
  merge() {
    return mapReducerDispatchListA(this.onMoveList,
      v => v.value,
      function (d, a) {
        return {
          type: "changeY",
          key: a.key,
          value: d
        } as const
      })
  }
}

function getElementKey<K, E>(element: ReorderElement<K, E>) {
  return element.key
}

function getDefaultGap(oldGap: number, newGap?: number) {
  if (typeof newGap == 'number') {
    return newGap
  }
  return oldGap
}

/**
 * 有一个问题:如果没有render,不应该触发新的排序
 * @param getKey 
 * @param config 
 * @param animateNumberFrameReducer 
 * @param getHeight 
 * @param getDiffHeight 
 * @returns 
 */
export function createReorderReducer<T, K, E>(
  getKey: (v: T) => K,
  config: AnimationConfig,
  animateNumberFrameReducer: ReducerWithDispatch<AnimateFrameModel, AnimateFrameAct>,
  getHeight: (e: E) => number
) {
  function getElementHeight(v: ReorderElement<K, E>) {
    return getHeight(v.div)
  }
  function changeDiff(
    ma: MergeAction<K>,
    model: ReorderModel<T, K>,
    key: K,
    diffY: number,
    elements: ReorderElement<K, E>[],
    gap: number
  ) {
    if (!diffY) {
      return [model.list, false] as const
    }
    let ty = 0
    let newList = model.list.map(row => {
      if (getKey(row.value) == key) {
        ty = row.transY.value + diffY
        const [transY, onMove] = animateNumberFrameReducer(row.transY, {
          type: "changeTo",
          target: ty
        })
        return {
          ...row,
          transY
        }
      }
      return row
    })
    const target = reorderCheckTarget(
      elements,
      getElementKey,
      getElementHeight,
      key,
      ty,
      diffY,
      gap
    )
    if (target) {
      const [idx, idx1] = target
      newList = arrayMove(newList, idx, idx1, true)

      /**
       * 如果向后移动
       * 从elements上取
       * 
       */
      let otherHeight = getHeight(elements[idx].div) + gap
      if (idx > idx1) {
        otherHeight = -otherHeight
      }
      //2->4,3-2,4-3
      //4->2,3-4,2-3
      rangeBetweenLeft(idx, idx1, function (i) {
        //对于所有非自己元素,移动当前元素的高度与gap
        //如何与react兼容?状态变更触发事件,需要在useEffect里依赖状态去触发事件....
        const row = newList[i]
        if (!row.transY.animateTo) {
          const [transY, onMove] = animateNumberFrameReducer(row.transY, {
            type: "changeTo",
            from: otherHeight,
            target: 0,
            config
          })
          ma.append(getKey(row.value), onMove)
          newList[i] = {
            ...row,
            transY
          }
        }
      })
      const row = newList[idx1]


      let diffHeight = 0
      rangeBetweenRight(idx, idx1, function (i) {
        const row = elements[i]
        const height = getHeight(row.div)
        diffHeight = diffHeight + height + gap
      })
      if (idx > idx1) {
        diffHeight = -diffHeight
      }
      /**
       * 部分改变,因为本身有偏移
       * 对于自己,偏移量为非自己到目标元素的高度+gap
       * 1->2,则是2的高度+gap
       * 2->1,则是1的高度=gap
       */
      const [transY, onMove] = animateNumberFrameReducer(row.transY, {
        type: "silentDiff",
        value: -diffHeight
      })
      newList[idx1] = {
        ...row,
        transY
      }
      return [newList, true] as const
    }
    return [newList, false] as const
  }
  return function <M extends ReorderModel<T, K>>(model: M, action: ReorderAction<K, E>): ReducerWithDispatchResult<M, ReorderAction<K, E>> {
    if (action.type == "changeY") {
      const ma = new MergeAction<K>()
      let stillOnMove = true
      const newList = model.list.map(row => {
        if (getKey(row.value) == action.key) {
          const [transY, onMove] = animateNumberFrameReducer(row.transY, action.value)
          if (onMove) {
            ma.append(action.key, onMove)
          } else if (model.onMove?.key == action.key) {
            stillOnMove = false
          }
          return {
            ...row,
            transY
          }
        }
        return row
      })
      return [{
        ...model,
        list: newList,
        onMove: stillOnMove ? model.onMove : undefined
      }, ma.merge()]
    } else if (action.type == "moveBegin") {
      return [{
        ...model,
        scrollTop: action.scrollTop,
        onMove: {
          key: action.key,
          info: {
            beginPoint: action.point,
            lastPoint: action.point
          }
        }
      }, undefined]
    } if (action.type == "didMove") {
      if (model.onMove?.info && model.version == action.version) {
        const index = model.onMove.key
        const info = model.onMove.info
        const gap = getDefaultGap(model.gap, action.gap)
        const ma = new MergeAction<K>()
        const diffY = action.point - info.lastPoint
        const diffYM = action.scrollTop - model.scrollTop
        const [newList, didChange] = changeDiff(ma, model, index, diffY + diffYM, action.elements, gap);
        return [
          {
            ...model,
            gap,
            list: newList,
            version: didChange ? action.version + 1 : action.version,
            scrollTop: action.scrollTop,
            onMove: {
              ...model.onMove,
              info: {
                ...model.onMove.info,
                lastPoint: action.point
              }
            }
          },
          ma.merge()]
      }
    } else if (action.type == "end") {
      if (model.onMove?.info) {
        const info = model.onMove.info
        if (model.version == action.version) {
          const index = model.onMove.key
          const diffY = action.point - info.lastPoint
          const diffYM = action.scrollTop - model.scrollTop
          return didEnd(model, index, diffY + diffYM, action)
        } else {
          //需要补充完成
          return [
            {
              ...model,
              onMove: {
                ...model.onMove,
                info: undefined,
                endAt: {
                  point: action.point,
                  lastPoint: model.onMove.info.lastPoint
                }
              }
            },
            undefined
          ]
        }
      }
    } else if (action.type == "didEnd") {
      if (model.onMove?.endAt) {
        const index = model.onMove.key
        const endAt = model.onMove.endAt
        const diffY = endAt.point - endAt.lastPoint
        const diffYM = action.scrollTop - model.scrollTop
        return didEnd(model, index, diffY + diffYM, action)
      }
    }
    return [model, undefined]
  }

  function didEnd<M extends ReorderModel<T, K>>(
    model: M,
    index: K,
    diff: number,
    action: {
      elements: ReorderElement<K, E>[]
      gap?: number
      config: AnimationConfig
      scrollTop: number
    }
  ): ReducerWithDispatchResult<M, ReorderAction<K, E>> {
    const gap = getDefaultGap(model.gap, action.gap)
    const ma = new MergeAction<K>()
    let [newList, didChange] = changeDiff(ma, model, index, diff, action.elements, gap);
    newList = newList.map(row => {
      if (getKey(row.value) == index) {
        const [transY, onMove] = animateNumberFrameReducer(row.transY, {
          type: "changeTo",
          target: 0,
          config: action.config
        })
        ma.append(index, onMove)
        return {
          ...row,
          transY
        }
      }
      return row
    })
    return [
      {
        ...model,
        gap,
        list: newList,
        version: didChange ? model.version + 1 : model.version,
        scrollTop: action.scrollTop,
        onMove: {
          ...model.onMove,
          endAt: undefined
        }
      },
      ma.merge()
    ]
  }
}