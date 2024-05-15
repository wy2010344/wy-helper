import { arrayMove } from "../ArrayHelper"
import { AnimateFrameAct, AnimationConfig } from "../animation"
import { EmptyFun } from "../util"
import { reorderCheckTarget } from "./util"
export type ReorderModel<K> = {
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
  version: number
  gap: number
  updateEffect: (fun?: () => void) => void
  changeIndex: (from: number, to: number, fun?: () => void) => void
}

/**
 * @todo 将里面的动画、拖动改变为对外部元素的通知执行
 * 但有一点,状态变更后位置交换,要变更后才能突变,即需要effect
 * 还好一个是布局动画,一个是安静的改变
 */
export type ReorderAction<K> = {
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
  elements: ReorderElement<K>[]
  scrollTop: number
} | {
  type: "end",
  point: number
} | {
  type: "didEnd",
  gap?: number
  scrollTop: number
  elements: ReorderElement<K>[]
  config: AnimationConfig
} | {
  type: "changeY"
  key: K
  value: AnimateFrameAct
} | {
  type: "layout",
  key: K
  offset: number
  config: AnimationConfig
}

export interface ReorderElement<K> {
  key: K
  getHeight(): number
  /**
   * 突变增加diff
   * @param diff 
   */
  changeDiff(diff: number): void
  /**
   * layout动画
   * @param value 
   */
  layoutFrom(value: number): void

  silentDiff(value: number): void
  /**
   * 拖拽结束归于0
   */
  endLayout(): void
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
    value: EmptyFun
  }[] = []
  append(index: K, v: EmptyFun) {
    this.onMoveList.push({
      key: index,
      value: v
    })
  }
  merge() {
    if (this.onMoveList.length) {
      return () => {
        this.onMoveList.forEach(row => {
          row.value()
        })
      }
    }
  }
}

function getElementKey<K>(element: ReorderElement<K>) {
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

function getElementHeight<K>(v: ReorderElement<K>) {
  return v.getHeight()
}
function getElement<K>(elements: ReorderElement<K>[], key: K) {
  return elements.find(v => v.key == key)
}
function changeDiff<K>(
  ma: MergeAction<K>,
  key: K,
  diffY: number,
  elements: ReorderElement<K>[],
  gap: number
) {
  let ty = 0
  const element = getElement(elements, key)
  if (element) {
    ma.append(key, function (dispatch) {
      element.changeDiff(diffY)
    })
  }
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
    const newElements = arrayMove(elements, idx, idx1, true)
    // newList = arrayMove(newList, idx, idx1, true)

    /**
     * 如果向后移动
     * 从elements上取
     * 
     */
    let otherHeight = elements[idx].getHeight() + gap
    if (idx > idx1) {
      otherHeight = -otherHeight
    }
    //2->4,3-2,4-3
    //4->2,3-4,2-3
    rangeBetweenLeft(idx, idx1, function (i) {
      //对于所有非自己元素,移动当前元素的高度与gap
      //如何与react兼容?状态变更触发事件,需要在useEffect里依赖状态去触发事件....
      const element = newElements[i]
      ma.append(key, function () {
        element.layoutFrom(otherHeight)
      })
    })
    let diffHeight = 0
    rangeBetweenRight(idx, idx1, function (i) {
      const row = elements[i]
      const height = row.getHeight()
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
    const element = elements[idx]
    ma.append(key, function () {
      element.silentDiff(-diffHeight)
    })
    return [idx, idx1] as const
  }
}
export function reorderReducer<K, M extends ReorderModel<K>>(
  model: M,
  action: ReorderAction<K>
): M {
  if (action.type == "moveBegin") {
    return {
      ...model,
      scrollTop: action.scrollTop,
      onMove: {
        key: action.key,
        info: {
          beginPoint: action.point,
          lastPoint: action.point
        }
      }
    }
  } if (action.type == "didMove") {
    if (model.onMove?.info && model.version == action.version) {
      const index = model.onMove.key
      const info = model.onMove.info
      const gap = getDefaultGap(model.gap, action.gap)
      const ma = new MergeAction<K>()
      const diffY = action.point - info.lastPoint
      const diffYM = action.scrollTop - model.scrollTop
      const change = changeDiff(ma, index, diffY + diffYM, action.elements, gap);
      let version = action.version
      if (change) {
        version = version + 1
        model.changeIndex(change[0], change[1], ma.merge())
      } else {
        model.updateEffect(ma.merge())
      }
      return {
        ...model,
        gap,
        version: version,
        scrollTop: action.scrollTop,
        onMove: {
          ...model.onMove,
          info: {
            ...model.onMove.info,
            lastPoint: action.point
          }
        }
      }
    }
  } else if (action.type == "end") {
    /**
     * @todo 似乎仍然不行
     * end的时候如果上次render没有完成,则视图列表不是最新的,需要didEnd
     * end的时候如果已经完成,则视图列表是最新的,不需要didEnd
     * 
     * 也许脱离react的拖动只能是结果(动画完成时才触发),才允许更新.
     */
    if (model.onMove?.info) {
      return {
        ...model,
        onMove: {
          ...model.onMove,
          info: undefined,
          endAt: {
            point: action.point,
            lastPoint: model.onMove.info.lastPoint
          }
        }
      }
    }
  } else if (action.type == "didEnd") {
    if (model.onMove?.endAt) {
      const key = model.onMove.key
      const gap = getDefaultGap(model.gap, action.gap)
      const ma = new MergeAction<K>()
      const endAt = model.onMove.endAt
      const diffY = endAt.point - endAt.lastPoint
      const diffYM = action.scrollTop - model.scrollTop
      const change = changeDiff(ma, key, diffY + diffYM, action.elements, gap);
      const element = getElement(action.elements, key)
      if (element) {
        ma.append(key, function () {
          element.endLayout()
        })
      }
      let version = model.version
      if (change) {
        version = version + 1
        model.changeIndex(change[0], change[1], ma.merge())
      } else {
        model.updateEffect(ma.merge())
      }
      return {
        ...model,
        gap,
        version: version,
        scrollTop: action.scrollTop,
        onMove: {
          ...model.onMove,
          endAt: undefined
        }
      }
    }
  }
  return model
}