import { DeltaXSignalAnimationConfig, EmptyFun, FalseType, Point, createAnimateSignal, defaultSpringAnimationConfig, emptyObject, pointEqual, run, trackSignal } from "wy-helper";
import { getPageOffset } from "../util";
import { animateSignal } from "./animateFrameValue";



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
  const transX = animateSignal(0)
  const transY = animateSignal(0)
  function setLastPs(ps: Point) {
    lastPS = ps
    saveTo?.(ps)
  }
  /**
   * 如果靠render来驱动,则需要如此
   */
  return function (div: HTMLElement, config: DeltaXSignalAnimationConfig = defaultSpringAnimationConfig) {
    function locationChange(ps: Point, lastPS: Point) {
      transX.set(transX.get() + ps.x - lastPS.x)
      transY.set(transY.get() + ps.y - lastPS.y)

      transX.change(config(-transX.get()))
      transY.change(config(-transY.get()))
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

    const d1 = trackSignal(() => {
      return {
        x: transX.get(),
        y: transY.get()
      }
    }, ({ x, y }) => {
      //这个动画不会出现布局列裂开
      div.style.transform = `translate(${-x}px,${-y}px)`
    })
    return function () {
      d1()
      if (destroy) {
        destroy()
      }
    }
  }
}