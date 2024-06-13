import { AnimateFrameEvent, AnimateFrameValue, FrictionalFactory, GetDeltaXAnimationConfig } from "../animation"
import { EmptyFun } from "../util"
import { RecycleScrollAction, getIdxWith } from "./reducer"


export function recicleScrollViewView(
  flushSync: (fun: EmptyFun) => void,
  addIndex: (n: number) => void,
  rowHeight: number,
  transY: AnimateFrameValue
) {
  let initScrollHeight = 0
  function aUpdate(value: number) {
    const diff = value - initScrollHeight
    const idx = getIdxWith(diff, rowHeight)
    if (idx) {
      transY.slientDiff(idx * rowHeight)
      flushSync(() => {
        addIndex(idx)
      })
    }
  }

  function updateIndex(idx: number, getConfig: GetDeltaXAnimationConfig, e?: AnimateFrameEvent) {
    const nValue = idx * rowHeight + initScrollHeight
    // const to = transY.getAnimateTo()
    // let from = transY.get()
    // if (to?.hasTarget()) {
    //   aUpdate(to.target)
    //   from = to.target
    // }
    transY.changeTo(nValue, getConfig, {
      // from,
      onProcess(v) {
        aUpdate(v)
        e?.onProcess?.(v)
      },
      onFinish(v) {
        if (v) {
          aUpdate(transY.get())
        }
        e?.onFinish?.(v)
      },
    })
  }
  return {
    trans: transY,
    setInitScrollHeight(n: number) {
      initScrollHeight = n
      transY.changeTo(n)
    },
    /**
     * 偏移量
     * @param moveY 
     */
    moveUpdate(diff: number) {
      const target = diff + transY.get()
      transY.changeTo(target)
      aUpdate(target)
    },
    //速度
    endMove(idealDistance: number,
      getConfig: GetDeltaXAnimationConfig
    ) {
      const value = transY.get() + idealDistance - initScrollHeight
      const idx = Math.round(value / rowHeight)
      updateIndex(idx, getConfig)
    },
    stopScroll(toCurrent?: boolean) {
      let ato = transY.getAnimateTo()
      if (ato) {
        let nValue = ato.target
        if (toCurrent) {
          const v = transY.get() - initScrollHeight
          const idx = Math.round(v / rowHeight)
          nValue = idx * rowHeight + initScrollHeight
        }
        transY.changeTo(nValue)
        aUpdate(nValue)
      }
    },
    wrapperAdd(n: number, config?: GetDeltaXAnimationConfig, event?: AnimateFrameEvent) {
      if (n) {
        if (config) {
          updateIndex(-n, config, event)
        } else {
          addIndex(n)
        }
      }
    }
  }
}







export function recycleWithFraction(fc: FrictionalFactory) {
  return {
    endMove(
      endMove: (idealDistance: number,
        getConfig: GetDeltaXAnimationConfig
      ) => void,
      velocity: number
    ) {
      endMove(fc.getFromVelocity(velocity).maxDistance, distance => {
        return fc.getFromDistance(distance).animationConfig()
      })
    },
    endMoveDispatch(dispatch: (a: RecycleScrollAction) => void, velocity: number) {
      dispatch({
        type: "endMove",
        idealDistance: fc.getFromVelocity(velocity).maxDistance,
        getConfig(distance) {
          return fc.getFromDistance(distance).animationConfig()
        },
      })
    },
    distanceConfig(n: number) {
      return fc.getFromDistance(n).animationConfig()
    }
  }
}