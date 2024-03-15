


import { Reorder, pointZero, ReorderChild, Box, Point, emptyFun } from "wy-helper"
import { getPageOffset } from "./util"
import { subscribeRequestAnimationFrame } from "./animation"


export function getReorderOnScroll(rd: Reorder) {
  let lastScroll = pointZero
  return function (container: HTMLElement) {
    const top = container.scrollTop
    const left = container.scrollLeft
    const diffY = top - lastScroll.y
    const diffX = left - lastScroll.x
    rd.setMoveDiff({
      x: diffX,
      y: diffY
    })
    lastScroll = {
      x: left,
      y: top
    }
  }
}


export function reorderChildChangeIndex(
  child: ReorderChild,
  div: HTMLElement,
  onLayout: (diff: Point) => void,
  updateBox: (box: Box) => void = emptyFun
) {
  function animateFrmae() {
    const axisV = getPageLayoutData(div)
    updateBox(axisV)
    child.animateFrame(axisV, onLayout)
  }
  animateFrmae()
  child.releaseLock()
  return subscribeRequestAnimationFrame(animateFrmae)
}


export function getPageLayoutData(div: HTMLElement) {
  const loc = getPageOffset(div)
  const width = div.clientWidth
  const height = div.clientHeight
  const newB: Box = {
    x: {
      min: loc.x,
      max: loc.x + width
    },
    y: {
      min: loc.y,
      max: loc.y + height
    }
  }
  return newB
}