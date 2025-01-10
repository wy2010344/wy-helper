import { arrayFindIndexFrom, arrayMove } from "../ArrayHelper"
import { arrayReduceRight } from "../equal"
import { Box, Point, PointKey, boxEqual, pointZero } from "../geometry"
import { EmptyFun, ReadArray } from "../util"
import { reorderCheckTarget } from "./util"

export interface ReorderItemData<K> {
  index: number
  value: K
  layout: Box
}

type MoveV<K> = {
  lastValue: Point
  currentItem: ReorderChild<K>
  onFinish(): void
}

function getDirection<K>(dir: PointKey) {
  return function (n: ReorderItemData<K>) {
    return n.layout[dir].max - n.layout[dir].min
  }
}
const getSize: Point<(n: ReorderItemData<any>) => number> = {
  x: getDirection("x"),
  y: getDirection("y"),
}

function sortIndex<K>(a: ReorderItemData<K>, b: ReorderItemData<K>) {
  return a.index - b.index
}
export class Reorder<K> {
  checkToMove(key: K, offset: Point, diff: Point) {
    const index = this.layoutList.findIndex(v => v.value == key)
    const item = reorderCheckTarget(
      this.layoutList,
      index,
      getSize[this.direction],
      offset[this.direction],
      {
        gap: this.gap
      }
    )
    if (item) {
      const [index, targetIndex] = item
      this.moveItem(key, this.layoutList[targetIndex].value)
      arrayMove(this.layoutList, index, targetIndex)
      return true
    }
  }
  constructor(
    //如果这里不是实时的,就会有一点问题
    private moveItem: (itemKey: K, baseKey: K) => void,
    private direction: PointKey = 'y',
    private gap = 0
  ) {
    this.setMoveDiff = this.setMoveDiff.bind(this)
  }
  private layoutList: ReorderItemData<K>[] = []
  /**每次进来更新 */
  updateLayoutList<T>(
    moveItem: (itemKey: K, baseKey: K) => void,
    direction: PointKey,
    list: ReadArray<T>,
    getKey: (v: T) => K,
    gap = 0
  ) {
    this.moveItem = moveItem
    this.gap = gap
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
      this.end(pointZero)
    }
    this.layoutList.sort(sortIndex)
  }
  getCurrent() {
    return this.moveV?.currentItem
  }
  /**注册 */
  /**
   * 1.其实不一定用requestAnimateFrame来更新尺寸,用ResizeObserver可以实时更新尺寸
   * 2.拖拽可以在一次pointerdown事件中,而不必在全局状态中.
   * @param value 
   * @param axis 
   */
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
    return true
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
  end(loc?: Point) {
    const mv = this.moveV
    if (mv) {
      if (loc) {
        this.didMove(mv, loc)
      }
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

  /**
   * @todo
   * 不应该使用lock
   * 而应该使用更新后的最新定位
   * 不使用requestAnimateFrame
   * 而应该使用实时的状态
   * 如果位置更新,则进行相应的diff减少
   */
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


