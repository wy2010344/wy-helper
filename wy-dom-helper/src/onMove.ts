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
  onMove: (e: PointerEvent, end?: boolean) => void,
  eventType?: "pointer",
  arg?: OnMoveArg
): EmptyFun
export function subscribeMove(
  onMove: (e: TouchEvent, end?: boolean) => void,
  eventType: "touch", arg?: OnMoveArg
): EmptyFun
export function subscribeMove(
  onMove: (e: MouseEvent, end?: boolean) => void,
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
    return function () {
      element.removeEventListener("mousemove", move, moveOption)
      element.removeEventListener("mouseup", end, endOption)
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
export function subscribeDragMove(
  onMove: (pagePoint: PagePoint, end: boolean | undefined, e: Event) => void,
  arg?: OnMoveArg
) {
  const dm = subscribeMove(function (e, a) {
    onMove(e, a, e)
  }, 'mouse', arg)
  const dt = subscribeMove(function (e, a) {
    onMove(e.touches[0], a, e)
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

export function subscribeDragInit(div: Node, fun: (e: PagePoint | undefined, ole: Event) => void, capture?: boolean) {
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

export function cacheVelocity(BEFORE_LAST_KINEMATICS_DELAY = 32) {
  let last: {
    time: number,
    value: number
  } | undefined = undefined
  let velocity = 0
  function set(time: number, value: number): number
  function set(): void
  function set(): any {
    if (arguments.length == 0) {
      last = undefined
      velocity = 0
    } else {
      const time = arguments[0]
      const value = arguments[1]
      if (last) {
        const diffTime = time - last.time
        if (diffTime > BEFORE_LAST_KINEMATICS_DELAY) {
          velocity = (value - last.value) / diffTime
          last.value = value
          last.time = time
        }
      } else {
        velocity = 0
        last = {
          time,
          value
        }
      }
      return velocity
    }
  }
  return set
}