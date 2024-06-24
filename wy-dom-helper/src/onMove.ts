import { EmptyFun } from "wy-helper";

export type MoveEvent = "pointer" | "touch" | "mouse"

type OnMoveArg = {
  capture?: boolean | {
    move?: boolean
    end?: boolean | {
      end?: boolean
      cancel?: boolean
    }
  },
  element?: Element
}
export function subscribeMove(
  onMove: (e: PointerEvent, end?: true) => void,
  eventType?: "pointer",
  arg?: OnMoveArg
): EmptyFun
export function subscribeMove(
  onMove: (e: TouchEvent, end?: true) => void,
  eventType: "touch", arg?: OnMoveArg
): EmptyFun
export function subscribeMove(
  onMove: (e: MouseEvent, end?: true) => void,
  eventType: "mouse", arg?: OnMoveArg
): EmptyFun
export function subscribeMove(
  onMove: any,
  eventType: MoveEvent = "pointer",
  arg?: OnMoveArg) {
  function move(e: any) {
    onMove(e)
  }
  function end(e: any) {
    onMove(e, true)
  }
  const element = arg?.element || window

  let moveOption: AddEventListenerOptions = {}
  let endOption: AddEventListenerOptions = {}
  let cancelOption: AddEventListenerOptions = {}
  const c = arg?.capture
  if (c) {
    if (typeof c == 'boolean') {
      moveOption.capture = true
      endOption.capture = true
      cancelOption.capture = true
    } else {
      if (c.move) {
        moveOption.capture = true
      }
      const e = c.end
      if (e) {
        if (typeof e == 'boolean') {
          endOption.capture = true
          cancelOption.capture = true
        } else {
          if (e.end) {
            endOption.capture = true
          }
          if (e.cancel) {
            cancelOption.capture = true
          }
        }
      }
    }

  }

  if (eventType == "mouse") {
    element.addEventListener("mousemove", move, moveOption)
    element.addEventListener("mouseup", end, endOption)
    element.addEventListener("mouseleave", end, endOption)
    return function () {
      element.removeEventListener("mousemove", move, moveOption)
      element.removeEventListener("mouseup", end, endOption)
      element.removeEventListener("mouseleave", end, endOption)
    }
  } else if (eventType == "pointer") {
    element.addEventListener("pointermove", move, moveOption)
    element.addEventListener("pointerup", end, endOption)
    element.addEventListener("pointercancel", end, cancelOption)
    return function () {
      element.removeEventListener("pointermove", move, moveOption)
      element.removeEventListener("pointerup", end, endOption)
      element.removeEventListener("pointercancel", end, cancelOption)
    }
  } else if (eventType == "touch") {
    element.addEventListener("touchmove", move, moveOption)
    element.addEventListener("touchend", end, endOption)
    element.addEventListener("touchcancel", end, cancelOption)
    return function () {
      element.removeEventListener("touchmove", move, moveOption)
      element.removeEventListener("touchend", end, endOption)
      element.removeEventListener("touchcancel", end, cancelOption)
    }
  } else {
    throw new Error('不知道是什么类型' + eventType)
  }
}

export interface PagePoint {
  pageX: number
  pageY: number
  screenX: number
  screenY: number
  clientX: number
  clientY: number
}

interface DragMove {
  (pagePoint: PagePoint | undefined, e: Event): void
}
export function subscribeDragMove(
  onMove: DragMove,
  arg?: OnMoveArg
) {
  const dm = subscribeMove(function (e, a) {
    onMove(e, e)
    if (a) {
      onMove(undefined, e)
    }
  }, 'mouse', arg)
  const dt = subscribeMove(function (e, a) {
    onMove(a ? undefined : e.touches[0], e)
  }, 'touch', arg)
  return function () {
    dm()
    dt()
  }
}

export function dragInit(fun: (e: PagePoint, m: Event) => void) {
  return {
    onMouseDown(e: MouseEvent) {
      fun(e, e)
    },
    onTouchStart(e: TouchEvent) {
      fun(e.touches[0], e)
    }
  }
}



function subscribeEvent(div: any, type: string, fun: any, opt: any) {
  div.addEventListener(type, fun, opt)
  return function () {
    div.removeEventListener(type, fun, opt)
  }
}

export function subscribeDragInit(div: Node, fun: (e: PagePoint, ole: Event) => void, capture?: boolean) {
  let cancelOption: AddEventListenerOptions = {
    capture
  }
  const d1 = subscribeEvent(div, "mousedown", function (e: any) {
    fun(e, e)
  }, cancelOption)
  const d2 = subscribeEvent(div, "touchstart", function (e: any) {
    fun(e.touches[0], e)
  }, cancelOption)
  return function () {
    d1()
    d2()
  }
}