import { Box, Point, StoreRef, axisEqual, numberBetween, valueCenterOf } from "."








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
export class DragMove<C> {
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


/**
 * 拖动的时候保证光标对齐
 * @param callback 返回消耗了多少delta
 * @returns 
 */
export function doMoveAcc(callback: (v: number) => number) {
  let acc = 0;
  /**
   * 每次移动的delta量
   */
  return function (delta: number) {
    if (acc * delta < 0) {
      const nX = delta + acc;
      if (nX * acc < 0) {
        //方向改变
        acc = 0;
        delta = nX;
      } else {
        //抵消
        acc = nX;
        delta = 0;
      }
    }
    if (delta) {
      const diff = callback(delta);
      acc = acc + delta - diff;
    }
  };
}



export function movePanelResizeAutoHeight(
  size: StoreRef<number>,
  {
    direction,
    init = 0,
    margin = 0,
    marginBegin = margin,
    marginEnd = margin,
    minSize = 0,
    getMaxSize,
  }: {
    direction: "x" | "y";
    init?: number;
    minSize?: number;
    margin?: number;
    marginBegin?: number;
    marginEnd?: number;
    getMaxSize(): number;
  }
) {
  let position: StoreRef<number>;
  return {
    init: numberBetween(marginBegin, init, getMaxSize() - marginEnd - size.get()),
    setPosition(p: StoreRef<number>) {
      position = p;
    },
    onMove(step: DragMoveStep) {
      function setPosition(
        delta: number,
        max = getMaxSize() - marginEnd - size.get()
      ) {
        const newLeft = numberBetween(marginBegin, position.get() + delta, max);
        const diff = newLeft - position.get();
        position.set(newLeft);
        return diff;
      }
      return function (delta: number) {
        if (step.action == "move") {
          return setPosition(delta);
        } else if (step.action == "drag") {
          if (
            (direction == "y" && step.top) ||
            (direction == "x" && step.left)
          ) {
            const diff = setPosition(
              delta,
              position.get() + size.get() - minSize
            );
            size.set(size.get() - diff);
            return diff;
          } else if (
            (direction == "x" && step.right) ||
            (direction == "y" && step.bottom)
          ) {
            const newHeight = numberBetween(
              minSize,
              size.get() + delta,
              getMaxSize() - margin - position.get()
            );
            const diff = newHeight - size.get();
            size.set(newHeight);
            return diff;
          }
        }
        return 0;
      };
    },
    /**
     * body.offsetHeight
     * @param contentSize
     */
    resizeScroll(contentSize: number, onNoResize: () => void) {
      const overY = position.get() + contentSize + margin - getMaxSize();
      if (overY > 0) {
        //已经溢出,尝试调整top
        const ot = overY - position.get();
        const maxHeight = getMaxSize() - margin * 2;
        if (ot > 0) {
          //top没有,直接最大
          position.set(margin);
          size.set(maxHeight);
          onNoResize();
        } else {
          //top更多,向上移动,底部对齐
          const newPosition = Math.max(position.get() - overY, margin);
          position.set(newPosition);
          size.set(getMaxSize() - margin - position.get());
          if (newPosition == margin) {
            onNoResize();
          }
        }
      } else {
        //尝试扩展到最大
        size.set(contentSize);
        onNoResize();
      }
    },
    fixResize() {
      const overY = position.get() + size.get() + margin - getMaxSize();
      if (overY > 0) {
        //溢出了,先减少高度,再减少位置
        const less = size.get() - overY;
        if (less > minSize) {
          size.set(less);
        } else {
          size.set(minSize);
          position.set(Math.max(position.get() + less - minSize, marginBegin));
        }
      }
    },
  };
}
export type DragMoveStep =
  | {
    action: "move";
  }
  | ({
    action: "drag";
  } & {
    top?: boolean;
    left?: boolean;
    right?: boolean;
    bottom?: boolean;
  });
