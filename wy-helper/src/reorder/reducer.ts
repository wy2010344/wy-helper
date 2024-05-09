import { arrayMove } from "../ArrayHelper"
import { ReducerDispatch, ReducerWithDispatch, ReducerWithDispatchResult, mapReducerDispatchListA } from "../ValueCenter"
import { AnimateFrameAct, AnimateFrameModel, AnimationConfig } from "../animation"
import { Point } from "../geometry"
import { reorderCheckTarget } from "./util"
export type ReorderModelRow<T> = {
  transY: AnimateFrameModel<number>
  value: T
}
export type ReorderModel<T, K> = {
  onMove?: {
    key: K
    info?: {
      beginPoint: Point
      lastPoint: Point
    },
    endAt?: {
      point: Point
      lastPoint: Point
    }
  }
  scrollTop: number
  version: number
  gap: number
  list: ReorderModelRow<T>[]
}


export type ReorderAction<K, E> = {
  type: "moveBegin"
  key: K
  point: Point
  scrollTop: number
} | {
  type: "didMove"
  version: number
  point: Point
  gap?: number
  elements: Element<K, E>[]
  scrollTop: number
} | {
  type: "end",
  point: Point
} | {
  type: "didEnd",
  gap?: number
  scrollTop: number
  elements: Element<K, E>[]
  config: AnimationConfig
} | {
  type: "changeY"
  key: K
  value: AnimateFrameAct<number>
} | {
  type: "layout",
  key: K
  offset: number
  config: AnimationConfig
} | {
  type: "onScroll",
  gap?: number
  elements: Element<K, E>[]
  version: number
  scrollTop: number
}

type Element<K, E> = {
  key: K,
  div: E
}


function rangeBetween(idx: number, idx1: number, callback: (i: number) => void) {
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

class MergeAction<K> {
  onMoveList: {
    key: K,
    value: ReducerDispatch<AnimateFrameAct<number>>
  }[] = []
  append(index: K, v: ReducerDispatch<AnimateFrameAct<number>>) {
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

function getElementKey<K, E>(element: Element<K, E>) {
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
  animateNumberFrameReducer: ReducerWithDispatch<AnimateFrameModel<number>, AnimateFrameAct<number>>,
  getHeight: (e: E) => number
) {
  function getElementHeight(v: Element<K, E>) {
    return getHeight(v.div)
  }
  function changeDiff(
    ma: MergeAction<K>,
    model: ReorderModel<T, K>,
    key: K,
    diffY: number,
    elements: Element<K, E>[],
    gap: number
  ) {
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
      let diffHeight = 0
      rangeBetween(idx, idx1, function (i) {
        const row = elements[i]
        const height = getHeight(row.div)
        diffHeight = diffHeight + height + gap
      })
      if (idx > idx1) {
        diffHeight = -diffHeight
      }
      //2->4,3-2,4-3
      //4->2,3-4,2-3
      rangeBetween(idx, idx1, function (i) {
        const row = newList[i]
        if (!row.transY.animateTo) {
          const [transY, onMove] = animateNumberFrameReducer(row.transY, {
            type: "changeTo",
            from: diffHeight,
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
      //部分改变,因为本身有偏移
      const [transY, onMove] = animateNumberFrameReducer(row.transY, {
        type: "silentDiff",
        value: -diffHeight
      })
      newList[idx1] = {
        ...row,
        transY
      }
    }
    return newList
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
    } else if (action.type == "onScroll") {
      if (model.version == action.version && model.onMove?.info) {
        const ma = new MergeAction<K>()
        const gap = getDefaultGap(model.gap, action.gap)
        const diffY = action.scrollTop - model.scrollTop
        const newList = changeDiff(ma, model, model.onMove.key, diffY, action.elements, gap)
        return [{
          ...model,
          gap,
          scrollTop: action.scrollTop,
          version: action.version + 1,
          list: newList
        }, ma.merge()]
      }
    } else if (action.type == "didMove") {
      if (model.onMove?.info && model.version == action.version) {
        const index = model.onMove.key
        const info = model.onMove.info
        const gap = getDefaultGap(model.gap, action.gap)
        const ma = new MergeAction<K>()
        const diffY = action.point.y - info.lastPoint.y
        const diffYM = action.scrollTop - model.scrollTop
        const newList = changeDiff(ma, model, index, diffY + diffYM, action.elements, gap);
        return [
          {
            ...model,
            gap,
            list: newList,
            version: action.version + 1,
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
    } else if (action.type == "didEnd") {
      if (model.onMove?.endAt) {
        const index = model.onMove.key
        const gap = getDefaultGap(model.gap, action.gap)
        const ma = new MergeAction<K>()
        const endAt = model.onMove.endAt
        const diffY = endAt.point.y - endAt.lastPoint.y
        const diffYM = action.scrollTop - model.scrollTop
        let newList = changeDiff(ma, model, index, diffY + diffYM, action.elements, gap);
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
            version: model.version + 1,
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
    return [model, undefined]
  }
}