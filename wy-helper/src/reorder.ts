import { arrayFindIndexFrom, arrayMove } from "./ArrayHelper"
import { ReducerDispatch, ReducerWithDispatch, ReducerWithDispatchResult, mapReducerDispatchListA } from "./ValueCenter"
import { AnimateFrameModel, AnimateNumberFrameAction, AnimationConfig } from "./animation"
import { arrayReduceRight } from "./equal"
import { Box, Point, PointKey, boxEqual } from "./geometry"
import { EmptyFun, ReadArray } from "./util"

export interface ReorderItemData {
  index: number
  value: any
  layout: Box
}

function reorderItemDataGetKey(n: ReorderItemData) {
  return n.value
}

/**
 * 
 * @param order 
 * @param getKey 
 * @param getHeight 
 * @param key 
 * @param offset 偏移量
 * @param speed 速度决定判断的方向
 * @returns 
 */
export function reorderCheckTarget<T>(
  order: T[],
  getKey: (n: T, i: number) => any,
  getHeight: (n: T, i: number) => number,
  key: any,
  offset: number,
  speed: number
) {
  'worklet';
  //速度为0时,不调整
  if (!speed) {
    return
  }
  const index = order.findIndex((item, i) => getKey(item, i) == key)
  if (index < 0) {
    return
  }
  const nextOffset = speed > 0 ? 1 : -1

  let nextHeightOffset = 0
  let flagIndex = index
  while (flagIndex > -1 && flagIndex < order.length) {
    const nextIndex = flagIndex + nextOffset
    const nextItem = order[nextIndex]
    if (!nextItem) {
      break
    }

    const nextHeight = getHeight(nextItem, nextIndex)
    const nextHeightCenter = nextHeight / 2
    if (
      (nextOffset > 0 && offset > nextHeightOffset + nextHeightCenter) ||
      (nextOffset < 0 && offset < nextHeightOffset - nextHeightCenter)
    ) {
      flagIndex = nextIndex
      nextHeightOffset += (nextHeight * nextOffset)
    } else {
      break
    }
  }
  if (flagIndex != index) {
    return [index, flagIndex] as const
  }
}


type MoveV<K> = {
  lastValue: Point
  currentItem: ReorderChild<K>
  onFinish(): void
}

function getDirection(dir: PointKey) {
  return function (n: ReorderItemData) {
    return n.layout[dir].max - n.layout[dir].min
  }
}
const getSize: Point<(n: ReorderItemData) => number> = {
  x: getDirection("x"),
  y: getDirection("y"),
}

function sortIndex(a: ReorderItemData, b: ReorderItemData) {
  return a.index - b.index
}
export class Reorder<K = any> {
  checkToMove(key: K, offset: Point, diff: Point) {
    const item = reorderCheckTarget(
      this.layoutList,
      reorderItemDataGetKey,
      getSize[this.direction],
      key,
      offset[this.direction],
      diff[this.direction])
    if (item) {
      const [index, targetIndex] = item
      this.moveItem(key, this.layoutList[targetIndex].value)
      arrayMove(this.layoutList, index, targetIndex)
      // const diffHeight = this.layoutList[targetIndex].layout[this.direction].min - this.layoutList[index].layout[this.direction].min
      // rangeBetween(index, targetIndex, i => {
      //   const layout = this.layoutList[i].layout
      //   layout[this.direction].min
      // })
      return true
    }
  }
  constructor(
    //如果这里不是实时的,就会有一点问题
    private moveItem: (itemKey: K, baseKey: K) => void
  ) {
    this.setMoveDiff = this.setMoveDiff.bind(this)
  }
  private layoutList: ReorderItemData[] = []
  private direction: PointKey = 'y'
  /**每次进来更新 */
  updateLayoutList<T>(
    direction: PointKey,
    list: ReadArray<T>,
    getKey: (v: T) => K
  ) {
    arrayReduceRight(this.layoutList, (row, i) => {
      const idx = arrayFindIndexFrom(list, 0, v => getKey(v) == row.value)
      if (idx < 0) {
        this.layoutList.splice(i, 1)
      } else {
        row.index = idx
      }
    })
    for (let i = 0; i < list.length; i++) {
      const key = getKey(list[i])
      if (!this.layoutList.find(v => v.value == key)) {
        this.layoutList.push({
          index: i,
          value: key,
          layout: undefined as any
        })
      }
    }
    if (this.moveV) {
      if (!this.layoutList.find(v => v.value == this.moveV?.currentItem.key)) {
        this.moveV = undefined
      }
    }
    if (this.direction != direction) {
      this.direction = direction
    }
    this.layoutList.sort(sortIndex)
  }
  getCurrent() {
    return this.moveV?.currentItem
  }
  /**注册 */
  registerItem(value: K, axis: Box) {
    //依赖于requestAnimationFrame等去获得实时坐标,并不能完全对等
    const order = this.layoutList
    const idx = order.findIndex((entry) => value === entry.value)
    if (idx !== -1) {
      const ox = order[idx]
      ox.layout = axis
    } else {
      order.push({
        index: 0,
        value: value,
        layout: axis
      })
    }
  }
  private moveV: MoveV<K> | undefined = undefined
  setMoveV(v: MoveV<K>) {
    this.moveV = v
  }
  setMoveDiff(v: Point) {
    this.moveV?.currentItem.setMoveDiff(v)
  }
  private didMove(mv: MoveV<K>, loc: Point) {
    mv.currentItem.setMoveDiff({
      x: loc.x - mv.lastValue.x,
      y: loc.y - mv.lastValue.y
    })
  }
  move(loc: Point) {
    const mv = this.moveV
    if (mv) {
      this.didMove(mv, loc)
      mv.lastValue = loc
      return true
    }
  }
  end(loc: Point) {
    const mv = this.moveV
    if (mv) {
      this.didMove(mv, loc)
      this.moveV = undefined
      mv.onFinish()
      return true
    }
  }
}


export class ReorderChild<K> {
  private cb: Box | undefined = undefined
  constructor(
    private parent: Reorder<K>,
    public readonly key: any,
    private getTrans: () => Point,
    private changeTo: (value: Point) => void
  ) { }
  getBox() {
    return this.cb!
  }
  private setValue(newB: Box) {
    this.cb = newB
    this.parent.registerItem(this.key, newB)
  }
  animateFrame(newB: Box, onLayout: (diff: Point) => void) {
    const oldB = this.cb
    if (!oldB) {
      this.setValue(newB)
    } else if (!boxEqual(oldB, newB)) {
      this.setValue(newB)
      const diffX = oldB.x.min - newB.x.min
      const diffY = oldB.y.min - newB.y.min
      if (diffX || diffY) {
        if (this.parent.getCurrent() != this) {
          //应该执行布局动画
          onLayout({
            x: diffX,
            y: diffY
          })
        } else {
          const trans = this.getTrans()
          //位置改变
          this.changeTo({
            x: trans.x + diffX,
            y: trans.y + diffY
          })
        }
      }
    }
  }
  private lock = false
  setMoveDiff(diff: Point) {
    const trans = this.getTrans()
    const offset = {
      x: trans.x + diff.x,
      y: trans.y + diff.y
    }
    this.changeTo(offset)
    if (this.lock) {
      return
    }
    if (this.parent.checkToMove(this.key, offset, diff)) {
      this.lock = true
    }
  }
  releaseLock() {
    this.lock = false
  }
  start(loc: Point, onFinish: EmptyFun) {
    this.parent.setMoveV({
      lastValue: loc,
      currentItem: this,
      onFinish
    })
  }
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


export type ReorderAction<K, E> = {
  type: "moveBegin"
  key: K
  point: Point
} | {
  type: "didMove"
  point: Point
  elements: Element<K, E>[]
  end?: AnimationConfig
} | {
  type: "changeY"
  key: K
  value: AnimateNumberFrameAction
} | {
  type: "changeDiff"
  elements: Element<K, E>[]
  diffY: number
} | {
  type: "layout",
  key: K
  offset: number
  config: AnimationConfig
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

function getElementKey<K, E>(element: Element<K, E>) {
  return element.key
}
export function createReorderReducer<T, K, E>(
  getKey: (v: T) => K,
  config: AnimationConfig,
  animateNumberFrameReducer: ReducerWithDispatch<AnimateFrameModel<number>, AnimateNumberFrameAction>,
  getHeight: (e: E) => number,
  getDiffHeight: (after: E, before: E) => number
) {
  function getElementHeight(v: Element<K, E>) {
    return getHeight(v.div)
  }
  function changeDiff(
    ma: MergeAction<K>,
    model: ReorderModel<T, K>,
    key: K,
    diffY: number,
    elements: Element<K, E>[]
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
      diffY
    )
    if (target) {
      const [idx, idx1] = target
      newList = arrayMove(newList, idx, idx1, true)
      const diffHeight = getDiffHeight(elements[idx1].div, elements[idx].div)
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