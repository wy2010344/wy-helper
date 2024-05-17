import { arrayMove } from "../ArrayHelper"
import { AnimationConfig } from "../animation"
import { EmptyFun, run } from "../util"
import { rangeBetweenLeft, rangeBetweenRight, reorderCheckTarget } from "./util"
export type ReorderLocalModel<K> = {
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
  changeIndex: (
    from: number,
    to: number, version: number,
    fun?: () => void) => void
}

/**
 * @todo 将里面的动画、拖动改变为对外部元素的通知执行
 * 但有一点,状态变更后位置交换,要变更后才能突变,即需要effect
 * 还好一个是布局动画,一个是安静的改变
 */
export type ReorderLocalAction<K> = {
  type: "moveBegin"
  key: K
  point: number
  scrollTop: number
} | {
  //在滚动的时候,也使用这个
  type: "didMove"
  point: number

  version: number
  gap?: number
  elements: ReorderLocalElement<K>[]
  scrollTop: number
} | {
  type: "end",
  point: number
  config: AnimationConfig

  version: number
  gap?: number
  elements: ReorderLocalElement<K>[]
  scrollTop: number
} | {
  type: "didEnd",
  config: AnimationConfig

  gap?: number
  version: number
  scrollTop: number
  elements: ReorderLocalElement<K>[]
}

export interface ReorderLocalElement<K> {
  key: K
  getHeight(): number
  getTransY(): number
  /**
   * 突变增加diff
   * @param diff 
   */
  changeDiff(diff: number): void

  silentDiff(value: number): void
  /**
   * layout动画,在内部去阻止重新动画
   * @param value 
   */
  layoutFrom(value: number): void
  /**
   * 拖拽结束归于0
   */
  endLayout(): void
}


class MergeAction<K> {
  onMoveList: EmptyFun[] = []
  append(v: EmptyFun) {
    this.onMoveList.push(v)
  }
  merge() {
    if (this.onMoveList.length) {
      return () => {
        this.onMoveList.forEach(run)
      }
    }
  }
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

function getElementHeight<K>(v: ReorderLocalElement<K>) {
  return v.getHeight()
}
function getElementIndex<K>(elements: ReorderLocalElement<K>[], key: K) {
  return elements.findIndex(v => v.key == key)
}
function changeDiff<K>(
  ma: MergeAction<K>,
  currentIndex: number,
  diffY: number,
  elements: ReorderLocalElement<K>[],
  gap: number,
  canChange: boolean
) {
  if (!diffY) {
    return
  }
  let ty = 0
  const element = elements[currentIndex]
  ty = element.getTransY() + diffY
  ma.append(function () {
    element.changeDiff(diffY)
  })
  if (!canChange) {
    return
  }

  const target = reorderCheckTarget(
    elements,
    currentIndex,
    getElementHeight,
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
      ma.append(function () {
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
    ma.append(function () {
      element.silentDiff(-diffHeight)
    })
    return [idx, idx1] as const
  }
}
export function reorderLocalReducer<K, M extends ReorderLocalModel<K>>(
  model: M,
  action: ReorderLocalAction<K>
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
    if (model.onMove?.info) {
      const key = model.onMove.key
      const info = model.onMove.info
      const gap = getDefaultGap(model.gap, action.gap)
      const ma = new MergeAction<K>()
      const diffY = action.point - info.lastPoint
      const diffYM = action.scrollTop - model.scrollTop
      const currentIndex = getElementIndex(action.elements, key)
      const change = changeDiff(
        ma, currentIndex,
        diffY + diffYM,
        action.elements,
        gap,
        model.version == action.version
      );
      let version = action.version
      if (change) {
        version = version + 1
        model.changeIndex(change[0], change[1], version, ma.merge())
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
      const info = model.onMove.info
      if (model.version == action.version) {
        const index = model.onMove.key
        const diffY = action.point - info.lastPoint
        const diffYM = action.scrollTop - model.scrollTop
        return didEnd(model, index, diffY + diffYM, action)
      } else {
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
    }
  } else if (action.type == "didEnd") {
    if (model.onMove?.endAt) {
      const key = model.onMove.key
      const endAt = model.onMove.endAt
      const diffY = endAt.point - endAt.lastPoint
      const diffYM = action.scrollTop - model.scrollTop
      return didEnd(model, key, diffY + diffYM, action)
    }
  }
  return model
}

function didEnd<K, M extends ReorderLocalModel<K>>(
  model: M,
  key: K,
  diff: number,
  action: {
    version: number
    elements: ReorderLocalElement<K>[]
    gap?: number
    config: AnimationConfig
    scrollTop: number
  }) {
  const ma = new MergeAction<K>()
  const gap = getDefaultGap(model.gap, action.gap)

  const currentIndex = getElementIndex(action.elements, key)
  const change = changeDiff(ma,
    currentIndex,
    diff,
    action.elements,
    gap,
    action.version == model.version);


  const element = action.elements[currentIndex]
  if (element) {
    ma.append(function () {
      element.endLayout()
    })
  }

  let version = model.version
  if (change) {
    version = version + 1
    model.changeIndex(change[0], change[1], version, ma.merge())
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