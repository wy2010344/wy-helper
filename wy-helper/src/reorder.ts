import { arrayFindIndexFrom } from "./ArrayHelper"
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
    return order[flagIndex]
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
      this.moveItem(key, item.value)
    }
  }
  constructor(
    //如果这里是实时的,就会有问题
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
  setMoveDiff(diff: Point) {
    const trans = this.getTrans()
    const offset = {
      x: trans.x + diff.x,
      y: trans.y + diff.y
    }
    this.changeTo(offset)
    this.parent.checkToMove(this.key, offset, diff)
  }
  start(loc: Point, onFinish: EmptyFun) {
    this.parent.setMoveV({
      lastValue: loc,
      currentItem: this,
      onFinish
    })
  }
}