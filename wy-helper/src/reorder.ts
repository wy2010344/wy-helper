import { mixNumber } from "./NumberHelper"
import { removeWhere } from "./equal"
import { Axis, Box, Point, axisEqual, boxEqual, pointEqual, pointZero } from "./geometry"
import { EmptyFun } from "./util"

export interface ReorderItemData {
  value: any
  layout: Box
}

function checkReorder(
  order: ReorderItemData[],
  direction: "x" | "y",
  value: any,
  offsetP: Point,
  velocityP: Point,
) {
  const velocity = velocityP[direction]
  const offset = offsetP[direction]
  //速度为0时,不调整
  if (!velocity) {
    return
  }
  const index = order.findIndex(item => item.value == value)
  if (index < 0) {
    return
  }
  const nextOffset = velocity > 0 ? 1 : -1


  const item = order[index]
  const layout = item.layout[direction]


  let flagIndex = index
  while (flagIndex > -1 && flagIndex < order.length) {
    const nextIndex = flagIndex + nextOffset
    const nextItem = order[nextIndex]
    if (!nextItem) {
      break
    }
    const nextLayout = nextItem.layout[direction]
    const nextItemCenter = mixNumber(nextLayout.min, nextLayout.max, 0.5)
    if (
      (nextOffset == 1 && layout.max + offset > nextItemCenter) ||
      (nextOffset == -1 && layout.min + offset < nextItemCenter)
    ) {
      flagIndex = nextIndex
    } else {
      break
    }
  }
  if (flagIndex != index) {
    return order[flagIndex]
  }
}

type MoveV = {
  lastValue: Point
  currentItem: ReorderChild
  onFinish(): void
}

type ReorderDirection = 'x' | 'y'
export class Reorder {
  checkToMove(key: any, offset: Point, diff: Point) {
    const item = checkReorder(this.layoutList, this.direction, key, offset, diff)
    if (item) {
      this.moveItem(key, item.value)
      return true
    }
  }
  constructor(
    private moveItem: (itemKey: any, baseKey: any) => void
  ) { }
  private layoutList: ReorderItemData[] = []
  private direction: ReorderDirection = 'y'
  updateLayoutList(direction: ReorderDirection, shouldRemove: (key: any) => boolean) {
    this.direction = direction
    removeWhere(this.layoutList, function (value) {
      return shouldRemove(value.value)
    })
    if (this.moveV) {
      if (!this.layoutList.find(v => v.value == this.moveV?.currentItem.key)) {
        this.moveV = undefined
      }
    }
  }
  getCurrent() {
    return this.moveV?.currentItem
  }
  registerItem(value: any, axis: Box) {
    const order = this.layoutList
    const idx = order.findIndex((entry) => value === entry.value)
    if (idx !== -1) {
      const ox = order[idx]
      ox.layout = axis
    } else {
      order.push({
        value: value,
        layout: axis
      })
    }
    const dir = this.direction
    order.sort(function (a, b) {
      return a.layout[dir].min - b.layout[dir].min
    })
  }
  private moveV: MoveV | undefined = undefined
  setMoveV(v: MoveV) {
    this.moveV = v
  }
  setMoveDiff(v: Point) {
    this.moveV?.currentItem.setMoveDiff(v)
  }
  private didMove(mv: MoveV, loc: Point) {
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

  getChild(
    key: any,
    getTrans: () => Point,
    changeTo: (value: Point) => void
  ) {
    return new ReorderChild(this, key, getTrans, changeTo)
  }
}


class ReorderChild {
  private cb: Box | undefined = undefined
  private lockWaitSort = false
  constructor(
    private parent: Reorder,
    public readonly key: any,
    private getTrans: () => Point,
    private changeTo: (value: Point) => void
  ) {
    this.setMoveDiff = this.setMoveDiff.bind(this)
  }
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
        const trans = this.getTrans()
        if (pointEqual(trans, pointZero)) {
          //应该执行布局动画
          onLayout({
            x: diffX,
            y: diffY
          })
        } else {
          //位置改变
          this.changeTo({
            x: trans.x + diffX,
            y: trans.y + diffY
          })
        }
      }
    }
  }
  releaseLock() {
    this.lockWaitSort = false
  }
  setMoveDiff(diff: Point) {
    const trans = this.getTrans()
    const offset = {
      x: trans.x + diff.x,
      y: trans.y + diff.y
    }
    this.changeTo(offset)
    if (this.lockWaitSort) {
      return
    }
    const whichToPlace = this.parent.checkToMove(this.key, offset, diff)
    if (whichToPlace) {
      this.lockWaitSort = true
    }
  }
  start(loc: Point, onFinish: EmptyFun) {
    this.parent.setMoveV({
      lastValue: loc,
      currentItem: this,
      onFinish
    })
  }
}