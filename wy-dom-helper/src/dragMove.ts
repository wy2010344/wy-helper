import { EmptyFun, emptyObject, PointKey, run } from "wy-helper";
import { subscribeEventListener } from "./util";





export function stopSelect() {
  const style = document.body.style as any
  style.webkitUserSelect = 'none';
  style["msUserSelect"] = 'none';
  style["mozUserSelect"] = 'none';
  style["user-select"] = "none";
}
export function canSelect() {
  const style = document.body.style as any
  style.webkitUserSelect = '';
  style["msUserSelect"] = '';
  style["mozUserSelect"] = '';
  style["user-select"] = "";
}

function getX(e: any) {
  return e["pageX"] || e.touches[0]?.pageX;
}
function getY(e: any) {
  return e["pageY"] || e.touches[0]?.pageY;
}
export function initDrag(container: HTMLElement, config: {
  leaveEnd?: boolean
  start?(e: Event): void
  diffX?(x: number): void
  diffY?(y: number): void
  diff?(x: number, y: number): void
  move?(e: Event, x: number, y: number): void
  end?(e: Event, x: number, y: number): void
}) {
  let onDrag = false
  let lastX = 0
  let lastY = 0
  function onTouchStart(e: any) {
    if (onDrag) {
      return
    }
    onDrag = true
    config.start?.(e)
    lastX = getX(e)
    lastY = getY(e)
  }

  function onTouchMove(e: any) {
    if (!onDrag) {
      return
    }
    const thisX = getX(e)
    const thisY = getY(e)
    const diffX = thisX - lastX
    const diffY = thisY - lastY
    config.diffX?.(diffX)
    config.diffY?.(diffY)
    config.diff?.(diffX, diffY)
    config.move?.(e, diffX, diffY)
    lastX = thisX
    lastY = thisY
  }

  function onEnd(e: any) {
    if (!onDrag) {
      return
    }
    onDrag = false
    const thisX = getX(e)
    const thisY = getY(e)

    let allNumber = 0
    let diffX = 0, diffY = 0
    if (typeof (thisX) == 'number') {
      allNumber += 1
      diffX = thisX - lastX
      config.diffX?.(diffX)
    }
    if (typeof (thisY) == 'number') {
      allNumber += 1
      diffY = thisY - lastY
      config.diffY?.(diffY)
    }
    if (allNumber == 2) {
      config.diff?.(diffX, diffY)
    }
    config.end?.(e, diffX, diffY)
  }
  container.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchmove", onTouchMove);
  document.addEventListener("touchend", onEnd);
  container.addEventListener("mousedown", onTouchStart);
  document.addEventListener("mousemove", onTouchMove);
  document.addEventListener("mouseup", onEnd);

  document.addEventListener("touchcancel", onEnd)
  if (config.leaveEnd) {
    container.addEventListener("mouseleave", onEnd)
  }

  return () => {
    container.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onEnd);
    container.removeEventListener("mousedown", onTouchStart);
    document.removeEventListener("mousemove", onTouchMove);
    document.removeEventListener("mouseup", onEnd);

    document.removeEventListener("touchcancel", onEnd)
    if (config.leaveEnd) {
      container.removeEventListener("mouseleave", onEnd)
    }
  }
}



export interface Direction {
  l?: boolean,
  r?: boolean,
  t?: boolean,
  b?: boolean
}
export type ResizeHelper = ReturnType<typeof resizeHelper>
export function resizeHelper(p: {
  addLeft(x: number): void
  addTop(x: number): void,
  addWidth(x: number): void,
  addHeight(x: number): void
}) {
  return function (dir: Direction) {
    return function (x: number, y: number) {
      if (x != 0) {
        if (dir.l) {
          p.addLeft(x)
          p.addWidth(-x)
        }
        if (dir.r) {
          p.addWidth(x)
        }
      }
      if (y != 0) {
        if (dir.t) {
          p.addTop(y)
          p.addHeight(-y)
        }
        if (dir.b) {
          p.addHeight(y)
        }
      }
    }
  }
}

export type MoveEnd<T> = {
  onMove(e: T): void
  onEnd(e: T): void
  leave?: boolean
  cancel?: boolean
}

export type PointerBeginDirMove = (initE: PointerEvent, direction: PointKey) => MoveEnd<PointerEvent> | void
export function pointerMove(
  out: MoveEnd<PointerEvent>,
  element: HTMLElement | Document | SVGSVGElement = document
) {
  const destroyList: EmptyFun[] = []
  destroyList.push(subscribeEventListener(element, 'pointermove', e => out.onMove(e)))
  function endFun(e: PointerEvent) {
    out.onEnd(e)
    destroyList.forEach(run)
  }
  destroyList.push(subscribeEventListener(element, 'pointerup', endFun))
  if (out.leave) {
    destroyList.push(subscribeEventListener(element, 'pointerleave', endFun))
  }
  if (out.cancel) {
    destroyList.push(subscribeEventListener(element, 'pointercancel', endFun))
  }
}
export function pointerMoveDir(
  beginMove: PointerBeginDirMove,
  {
    eq = 'y',
    element = document
  }: {
    eq?: PointKey,
    element?: HTMLElement | Document | SVGSVGElement
  } = emptyObject as any
) {
  return function (e: PointerEvent) {
    const initE = e;
    const destroyJudgeMove = subscribeEventListener(element, 'pointermove', e => {
      destroyJudgeMove();
      destroyUp()
      const absY = Math.abs(e.pageY - initE.pageY)
      const absX = Math.abs(e.pageX - initE.pageX)
      let out: MoveEnd<PointerEvent> | void = undefined
      if (absX == absY) {
        out = beginMove(initE, eq)
      } else {
        if (absX > absY) {
          //左右移动
          out = beginMove(initE, 'x')
        } else {
          //上下移动
          out = beginMove(initE, 'y')
        }
      }
      if (out) {
        out.onMove(e)
        pointerMove(out, element)
      }
    })
    //避免点击后没有移动.
    const destroyUp = subscribeEventListener(element, 'pointerup', e => {
      destroyJudgeMove()
      destroyUp()
    })
  }
}