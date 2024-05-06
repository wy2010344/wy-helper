


import { pointZero, ReorderChild, Box, Point, emptyFun, AnimateFrameModel, reorderCheckTarget, arrayToMove, ReducerWithDispatchResult, ReducerDispatch, mapReducerDispatchList, AnimationConfig, PointKey, mapReducerDispatch, mapReducerDispatchListA } from "wy-helper"
import { getPageOffset } from "./util"
import { AnimateNumberFrameAction, animateNumberFrameReducer, subscribeRequestAnimationFrame } from "./animation"

export function getChangeOnScroll(change: (p: Point) => void) {
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

export function reorderChildChangeIndex<K>(
  child: ReorderChild<K>,
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
    }
  }
  list: ReorderModelRow<T>[]
}


export type ReorderAction<K> = {
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
    value: ReducerDispatch<AnimateNumberFrameAction>
  }[] = []
  append(index: K, v: ReducerDispatch<AnimateNumberFrameAction>) {
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
export function createReorderReducer<T, K>(
  getKey: (v: T) => K,
  dir: PointKey = 'y',
  config: AnimationConfig
) {
  function changeDiff(
    ma: MergeAction<K>,
    model: ReorderModel<T, K>,
    key: K,
    diffY: number,
    elements: Elements<K>,
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
  return function <M extends ReorderModel<T, K>>(model: M, action: ReorderAction<K>): ReducerWithDispatchResult<M, ReorderAction<K>> {
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
        const ma = new MergeAction<K>()
        const newList = changeDiff(ma, model, model.onMove.key, action.diffY, action.elements)
        return [{
          ...model,
          list: newList
        }, ma.merge()]
      }
    } else if (action.type == "didMove") {
      if (model.onMove?.info) {
        const index = model.onMove.key
        const info = model.onMove.info
        const ma = new MergeAction<K>()
        const diffY = action.point.y - info.lastPoint.y
        let newList = changeDiff(ma, model, index, diffY, action.elements);
        if (action.end) {
          newList = newList.map(row => {
            if (getKey(row.value) == index) {
              const [transY, onMove] = animateNumberFrameReducer(row.transY, {
                type: "changeTo",
                target: 0,
                config: action.end
              })
              ma.append(index, onMove)
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
          ma.merge()]
      }
    }
    return [model, undefined]
  }
}