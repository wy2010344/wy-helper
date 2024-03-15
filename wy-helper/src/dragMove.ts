import { Box, Point, axisEqual, valueCenterOf } from "."








type DragMoveFromInfo<C> = {
  container: FromContainer<C>
  relativePoint: Point
}

type FromContainer<C> = {
  data: C
  canEnter(c: CurrentContainer<C>): any
  didDrop(): void
  dragCancel(): void
}

type CurrentContainer<C> = {
  leave(): void
  didDrop(c: C): void
}
/**
 * 以事件的周期性建立原子模型
 * C 代表容器
 */
export class DragMove<C>{
  private fromContainer = valueCenterOf<DragMoveFromInfo<C> | undefined>(undefined)
  private currentContainer = valueCenterOf<CurrentContainer<C> | undefined>(undefined)

  private currentPoint = valueCenterOf<Point | undefined>(undefined)
  /**
   * 改变光标位置
   * @param pagePoint 
   */
  changePoint(pagePoint: Point) {
    if (this.fromContainer.get()) {
      this.currentPoint.set(pagePoint)
    }
  }
  /**
   * 开始拖拽
   * @param c 
   * @param pagePoint 光标位置
   * @param box 拖拽物的尺寸
   */
  startDrag(c: FromContainer<C>, pagePoint: Point, box: Box) {
    if (this.fromContainer.get()) {
      return
    }
    this.fromContainer.set({
      container: c,
      relativePoint: {
        x: pagePoint.x - box.x.min,
        y: pagePoint.y - box.y.min
      }
    })
    this.currentPoint.set(pagePoint)
  }

  //进入容器,且肯定不是来的容器
  enterContainer(c: CurrentContainer<C>) {
    const f = this.fromContainer.get()
    if (f && !this.currentContainer.get()) {
      if (f.container.canEnter(c)) {
        this.currentContainer.set(c)
      }
    }
  }

  //离开容器
  leaveContainer() {
    const c = this.currentContainer.get()
    if (this.fromContainer.get() && c) {
      c.leave()
      this.currentContainer.set(undefined)
    }
  }


  //停止,可能会需要停止动画
  stopDrag() {
    const s = this.fromContainer.get()
    if (s) {
      const c = this.currentContainer.get()
      if (c) {
        s.container.didDrop()
        c.didDrop(s.container.data)
      } else {
        s.container.dragCancel()
      }
      this.fromContainer.set(undefined)
      this.currentContainer.set(undefined)
    }
  }
}