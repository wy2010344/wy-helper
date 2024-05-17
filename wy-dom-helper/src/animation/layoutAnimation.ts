import { EaseFn, GetValue, Point, pointEqual, pointZero, syncMergeCenter, valueCenterOf } from "wy-helper";
import { animateFrame, subscribeRequestAnimationFrame } from "./animateFrameValue";
import { getPageOffset } from "../util";



export function layoutFrameAnimation(get: GetValue<HTMLElement>, config: {
  duration: number
  fn: EaseFn
}, lastPS?: Point) {
  const transX = animateFrame(0)
  const transY = animateFrame(0)
  const styleStore = valueCenterOf(pointZero)
  return function (ps?: Point) {
    if (ps) {
      lastPS = ps
    }
    const div = get()
    function locationChange(ps: Point, lastPS: Point) {
      transX.changeTo(transX.get() + ps.x - lastPS.x)
      transY.changeTo(transY.get() + ps.y - lastPS.y)

      transX.changeTo(0, config)
      transY.changeTo(0, config)
    }
    const destroyFrame = subscribeRequestAnimationFrame(function () {
      const ps = getPageOffset(div)
      if (lastPS) {
        if (!pointEqual(lastPS, ps)) {
          locationChange(ps, lastPS)
          lastPS = ps
        }
      } else {
        //第一次
        lastPS = ps
      }
    })

    const d1 = syncMergeCenter(transX, function (v) {
      // console.log("ddd", v)
      styleStore.set({
        ...styleStore.get(),
        x: v
      })
    })
    const d2 = syncMergeCenter(transY, function (v) {
      styleStore.set({
        ...styleStore.get(),
        y: v
      })
    })
    const d3 = syncMergeCenter(styleStore, function (o) {
      //这个动画不会出现布局列裂开
      div.style.transform = `translate(${-o.x}px,${-o.y}px)`
    })
    return function () {
      d1()
      d2()
      d3()
      destroyFrame()
    }
  }
}