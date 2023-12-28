


export type Offset = {
  left: number
  top: number
}
export type Rect = {
  width: number
  height: number
} & Offset

export type AxisDirection = "left" | "top"
export type Direction = "right" | "bottom" | AxisDirection
export type Alignment = "start" | "end" | "center"
export function opsiteDirection(v: Direction): Direction {
  if (v == 'left') {
    return 'right'
  } else if (v == 'right') {
    return 'left'
  } else if (v == 'top') {
    return 'bottom'
  } else {
    return 'top'
  }
}


function computeLeft(alignment: Alignment, target: Rect, popover: Rect) {
  if (alignment == 'start') {
    return target.left
  } else if (alignment == 'end') {
    return target.left + target.width - popover.width
  } else {
    return target.left + ((target.width - popover.width) / 2)
  }
}
function computeTop(alignment: Alignment, target: Rect, popover: Rect) {
  if (alignment == 'start') {
    return target.top
  } else if (alignment == 'end') {
    return target.top + target.height - popover.height
  } else {
    return target.top + ((target.height - popover.height) / 2)
  }
}
function arrowLeft(alignment: Alignment, target: Rect, popover: Rect) {
  if (alignment == 'start') {
    return Math.min(target.width, popover.width) / 2
  } else if (alignment == 'end') {
    return popover.width - Math.min(target.width, popover.width) / 2
  } else {
    return popover.width / 2
  }
}
function arrowTop(alignment: Alignment, target: Rect, popover: Rect) {
  if (alignment == 'start') {
    return Math.min(target.height, popover.height) / 2
  } else if (alignment == 'end') {
    return popover.height - Math.min(target.height, popover.height) / 2
  } else {
    return popover.height / 2
  }
}
export function computePosition(
  target: Rect,
  popover: Rect,
  direction: Direction,
  _alignment?: Alignment
) {
  const alignment = _alignment || 'center'
  return new ComputePosition(target, popover, direction, alignment)
}

class ComputePosition {
  constructor(
    public target: Rect,
    public popover: Rect,
    public direction: Direction,
    public alignment: Alignment
  ) {
    let top = 0, left = 0
    if (direction == 'top') {
      top = target.top - popover.height
      left = computeLeft(alignment, target, popover)
    } else if (direction == 'bottom') {
      top = target.top + target.height
      left = computeLeft(alignment, target, popover)
    } else if (direction == 'left') {
      left = target.left - popover.width
      top = computeTop(alignment, target, popover)
    } else if (direction == 'right') {
      left = target.left + target.width
      top = computeTop(alignment, target, popover)
    } else {
      throw new Error('unexpected direction' + this.direction)
    }
    this.offset = { top, left }
  }

  public readonly offset: Readonly<Offset>

  /**
   * 增加间矩
   * @param offset
   * @returns 
   */
  getTopLeft(offset = 0): Readonly<Offset> {
    if (offset == 0) {
      return this.offset
    } else if (this.direction == 'top') {
      return {
        ...this.offset,
        top: this.offset.top - offset
      }
    } else if (this.direction == 'left') {
      return {
        ...this.offset,
        left: this.offset.left - offset
      }
    } else if (this.direction == 'bottom') {
      return {
        ...this.offset,
        top: this.offset.top + offset
      }
    } else if (this.direction == 'right') {
      return {
        ...this.offset,
        left: this.offset.left + offset
      }
    } else {
      throw new Error('unexpected direction' + this.direction)
    }
  }

  arrowOffset: ArrowLocation | undefined = undefined
  /**
   * 箭头位置.
   * 箭头不是独立的,否则跟浮层一样了
   * 箭头是浮层内的绝对偏移
   * 注意,偏移要减去箭头自身的宽度.
   */
  getArrowOffset() {
    if (!this.arrowOffset) {
      if (this.direction == 'top') {
        this.arrowOffset = {
          zeroDirection: "bottom",
          offsetDirection: "left",
          offset: arrowLeft(this.alignment, this.target, this.popover)
        }
      } else if (this.direction == 'bottom') {
        this.arrowOffset = {
          zeroDirection: "top",
          offsetDirection: "left",
          offset: arrowLeft(this.alignment, this.target, this.popover)
        }
      } else if (this.direction == 'left') {
        this.arrowOffset = {
          zeroDirection: "right",
          offsetDirection: "top",
          offset: arrowTop(this.alignment, this.target, this.popover)
        }
      } else if (this.direction == 'right') {
        this.arrowOffset = {
          zeroDirection: "left",
          offsetDirection: "top",
          offset: arrowTop(this.alignment, this.target, this.popover)
        }
      } else {
        throw new Error('unknow direction')
      }
    }
    return this.arrowOffset
  }
}
export type ArrowLocation = {
  zeroDirection: Direction
  offsetDirection: AxisDirection
  offset: number
}

const defaultRect: Rect = {
  left: 0, top: 0, width: 0, height: 0
}

export function equalRect(a: Rect, b: Rect) {
  return a.left == b.left && a.top == b.top && a.width == b.width && a.height == b.height
}

export type CheckResult = {
  target: Rect
  popover: Rect
}
export function waitUntilQuit(
  getTargetRect: () => Rect | void,
  getPopoverRect: () => Rect | void,
  wait: () => Promise<any>
): Promise<CheckResult> {
  let beforeTargetRect = defaultRect, beforePopoverRect = defaultRect
  return new Promise(resolve => {
    function check() {
      const currentTargetRect = getTargetRect()
      const currentPopoverRect = getPopoverRect()
      if (currentTargetRect && currentPopoverRect) {
        if (equalRect(beforeTargetRect, currentTargetRect) && equalRect(beforePopoverRect, currentPopoverRect)) {
          resolve({
            target: currentTargetRect,
            popover: currentPopoverRect
          })
        } else {
          beforeTargetRect = currentTargetRect
          beforePopoverRect = currentPopoverRect
          wait().then(check)
        }
      } else {
        wait().then(check)
      }
    }
    check()
  })
}

export type CheckCallBack = (result: CheckResult) => void
export function foreverCheck(
  getTargetRect: () => Rect | void,
  getPopoverRect: () => Rect | void,
  wait: () => Promise<any>,
  call: CheckCallBack
) {
  let beforeTargetRect = defaultRect, beforePopoverRect = defaultRect
  let destroy = false
  function check() {
    if (destroy) {
      return
    }
    const currentTargetRect = getTargetRect()
    const currentPopoverRect = getPopoverRect()
    if (currentTargetRect && currentPopoverRect) {
      if (equalRect(beforeTargetRect, currentTargetRect) && equalRect(beforePopoverRect, currentPopoverRect)) {
        wait().then(check)
      } else {
        beforeTargetRect = currentTargetRect
        beforePopoverRect = currentPopoverRect
        call({
          target: currentTargetRect,
          popover: currentPopoverRect
        })
        wait().then(check)
      }
    } else {
      wait().then(check)
    }
  }
  check()
  return function () {
    destroy = true
  }
}