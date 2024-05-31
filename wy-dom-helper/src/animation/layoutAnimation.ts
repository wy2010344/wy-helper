import { AnimationConfig, EaseFn, EmptyFun, FalseType, GetDeltaXAnimationConfig, GetValue, Point, emptyObject, pointEqual, pointZero, run, syncMergeCenter, valueCenterOf } from "wy-helper";
import { animateFrame } from "./animateFrameValue";
import { getPageOffset } from "../util";



export function layoutFrameAnimation({
  init,
  saveTo,
  didInit = run
}: {
  init?: Point
  saveTo?(v: Point): void,
  didInit?(v: EmptyFun): EmptyFun | FalseType
} = emptyObject) {
  let lastPS = init
  const transX = animateFrame(0)
  const transY = animateFrame(0)
  const styleStore = valueCenterOf(pointZero)
  function setLastPs(ps: Point) {
    lastPS = ps
    saveTo?.(ps)
  }

  /**
   * 如果靠render来驱动,则需要如此
   */
  return function (div: HTMLElement, config: GetDeltaXAnimationConfig) {
    function locationChange(ps: Point, lastPS: Point) {
      transX.changeTo(transX.get() + ps.x - lastPS.x)
      transY.changeTo(transY.get() + ps.y - lastPS.y)

      transX.changeTo(0, config)
      transY.changeTo(0, config)
    }

    function notifyChange() {
      const ps = getPageOffset(div)
      if (lastPS) {
        if (!pointEqual(lastPS, ps)) {
          locationChange(ps, lastPS)
          setLastPs(ps)
        }
      } else {
        //第一次
        setLastPs(ps)
      }
    }
    //比如有的动画没有加载完
    const destroy = didInit(notifyChange)

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
      if (destroy) {
        destroy()
      }
    }
  }
}