


import { Reorder, pointZero, ReorderChild, Box, Point, emptyFun, AnimateFrameModel, reorderCheckTarget, arrayToMove, ReducerWithDispatchResult, ReducerDispatch, easeFns, mapReducerDispatchList, AnimationConfig, PointKey } from "wy-helper"
import { getPageOffset } from "./util"
import { AnimateNumberFrameAction, animateNumberFrameReducer, subscribeRequestAnimationFrame } from "./animation"

export function getDiffOnScroll(change: (p: Point) => void) {
  let lastScroll = pointZero
  return function (container: HTMLElement) {
    const top = container.scrollTop
    const left = container.scrollLeft
    const diffY = top - lastScroll.y
    const diffX = left - lastScroll.x
    change({
      x: diffX,
      y: diffY
    })
    lastScroll = {
      x: left,
      y: top
    }
  }
}

export function reorderChildChangeIndex(
  child: ReorderChild,
  div: HTMLElement,
  onLayout: (diff: Point) => void,
  updateBox: (box: Box) => void = emptyFun
) {
  function animateFrmae() {
    const axisV = getPageLayoutData(div)
    updateBox(axisV)
    child.animateFrame(axisV, onLayout)
  }
  animateFrmae()
  child.releaseLock()
  return subscribeRequestAnimationFrame(animateFrmae)
}


export function getPageLayoutData(div: HTMLElement) {
  const loc = getPageOffset(div)
  const width = div.clientWidth
  const height = div.clientHeight
  const newB: Box = {
    x: {
      min: loc.x,
      max: loc.x + width
    },
    y: {
      min: loc.y,
      max: loc.y + height
    }
  }
  return newB
}








type ReorderModelRow<T> = {
  transY: AnimateFrameModel<number>
  value: T
}
export type ReorderModel<T, K> = {
  onMove?: {
    key: K
    info?: {
      beginPoint: Point
      lastPoint: Point
    }
  }
  list: ReorderModelRow<T>[]
}


type ReorderAction<K> = {
  type: "moveBegin"
  key: K
  point: Point
} | {
  type: "didMove"
  point: Point
  elements: Elements<K>
  end?: AnimationConfig
} | {
  type: "changeY"
  key: K
  value: AnimateNumberFrameAction
} | {
  type: "changeDiff"
  elements: Elements<K>
  diffY: number
} | {
  type: "layout",
  key: K
  offset: number
  config: AnimationConfig
}

type Elements<K> = {
  key: K,
  div: HTMLElement
}[]

function changeDiff<T, K>(
  getKey: (v: T) => K,
  model: ReorderModel<T, K>,
  key: K,
  diffY: number,
  elements: Elements<K>,
  dir: PointKey
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
    v => v.key,
    dir == 'y' ? v => v.div.clientHeight : v => v.div.clientWidth,
    key,
    ty,
    diffY
  )
  if (target) {
    const idx = newList.findIndex(v => getKey(v.value) == key)
    const idx1 = newList.findIndex(v => getKey(v.value) == target.key)
    newList = arrayToMove(newList, idx, idx1)
    const diffHeight = dir == 'y'
      ? elements[idx1].div.offsetTop - elements[idx].div.offsetTop
      : elements[idx1].div.offsetLeft - elements[idx].div.offsetLeft
    newList = newList.map(row => {
      if (getKey(row.value) == key) {
        const [transY, onMove] = animateNumberFrameReducer(row.transY, {
          type: "silentDiff",
          value: -diffHeight
        })
        return {
          ...row,
          transY
        }
      }
      return row
    })
  }
  return newList
}

export function createReorderReducer<T, K>(getKey: (v: T) => K, dir: PointKey = 'y') {
  return function <M extends ReorderModel<T, K>>(model: M, action: ReorderAction<K>): ReducerWithDispatchResult<M, ReorderAction<K>> {
    if (action.type == "layout") {
      if (action.key != model.onMove?.key) {
        const onMoveList: ReducerDispatch<AnimateNumberFrameAction>[] = []
        const newList = model.list.map(row => {
          if (getKey(row.value) == action.key) {
            const [transY, onMove] = animateNumberFrameReducer(row.transY, {
              type: "changeTo",
              from: -action.offset,
              target: 0,
              config: action.config
            })
            onMoveList.push(onMove)
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
            list: newList
          },
          mapReducerDispatchList(onMoveList, v => {
            return {
              type: "changeY",
              key: action.key,
              value: v
            }
          })
        ]
      }
    } else if (action.type == "changeY") {
      const onMoveList: ReducerDispatch<AnimateNumberFrameAction>[] = []
      let stillOnMove = true
      const newList = model.list.map(row => {
        if (getKey(row.value) == action.key) {
          const [transY, onMove] = animateNumberFrameReducer(row.transY, action.value)
          if (onMove) {
            onMoveList.push(onMove)
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
      }, mapReducerDispatchList(onMoveList, v => {
        return {
          type: "changeY",
          key: action.key,
          value: v
        }
      })]
    } else if (action.type == "moveBegin") {
      return [{
        ...model,
        onMove: {
          key: action.key,
          info: {
            beginPoint: action.point,
            lastPoint: action.point
          }
        }
      }, undefined]
    } else if (action.type == "changeDiff") {
      if (model.onMove?.info) {
        const newList = changeDiff(getKey, model, model.onMove.key, action.diffY, action.elements, dir)
        return [{
          ...model,
          list: newList
        }, undefined]
      }
    } else if (action.type == "didMove") {
      if (model.onMove?.info) {
        const index = model.onMove.key
        const info = model.onMove.info
        const onMoveList: ReducerDispatch<AnimateNumberFrameAction>[] = []
        const diffY = action.point.y - info.lastPoint.y
        let newList = changeDiff(getKey, model, index, diffY, action.elements, dir);
        if (action.end) {
          newList = newList.map(row => {
            if (getKey(row.value) == index) {
              const [transY, onMove] = animateNumberFrameReducer(row.transY, {
                type: "changeTo",
                target: 0,
                config: action.end
              })
              onMoveList.push(onMove)
              return {
                ...row,
                transY
              }
            }
            return row
          })
        }
        return [
          {
            ...model,
            list: newList,
            onMove: action.end
              ? {
                ...model.onMove,
                info: undefined
              }
              : {
                ...model.onMove,
                info: {
                  ...model.onMove.info,
                  lastPoint: action.point
                }
              }
          },
          mapReducerDispatchList(onMoveList, v => {
            return {
              type: "changeY",
              key: index,
              value: v
            }
          })]
      }
    }
    return [model, undefined]
  }
}