import { AnimateFrameEvent, AnimateFrameValue, AnimationConfig, TweenAnimationConfig } from "../animation"
import { EaseFn, MomentumCallIdeal } from "../scroller"
import { EmptyFun } from "../util"


export function recicleScrollViewView(
  flushSync: (fun: EmptyFun) => void,
  addIndex: (n: number) => void,
  rowHeight: number,
  // momentum: MomentumCallIdeal,
  // scrollFn: EaseFn,
  transY: AnimateFrameValue
) {
  let initScrollHeight = 0
  function diffUpdate(diff: number) {
    let idx = 0
    if (diff >= rowHeight) {
      idx = -Math.floor(diff / rowHeight)
    } else if (diff <= -rowHeight) {
      idx = -Math.ceil(diff / rowHeight)
    }
    if (idx) {
      transY.slientDiff(idx * rowHeight)
      flushSync(() => {
        addIndex(idx)
      })
    }
  }
  function aUpdate(value: number) {
    diffUpdate(value - initScrollHeight)
  }
  return {
    trans: transY,
    setInitScrollHeight(n: number) {
      initScrollHeight = n
      transY.changeTo(n)
    },
    /**
     * 拖拽到当下的Y
     * @param moveY 
     */
    moveUpdate(moveY: number) {
      transY.changeTo(moveY + initScrollHeight)
      diffUpdate(moveY)
    },
    //速度
    endMove(idealDistance: number,
      getConfig: (realDistance: number) => AnimationConfig
    ) {
      // const fc = new FrictionalFactory()
      // fc.getFromVelocity(v).maxDistance 
      const value = transY.get() + idealDistance - initScrollHeight
      const idx = Math.round(value / rowHeight)
      const nValue = idx * rowHeight + initScrollHeight
      // const fc1 = fc.getFromDistance()
      const config = getConfig(nValue - transY.get())
      transY.changeTo(nValue, config, {
        onProcess(v) {
          aUpdate(v)
        },
        onFinish(v) {
          if (v) {
            aUpdate(transY.get())
          }
        },
      })
    },
    // scroll: buildNoEdgeScroll({
    //   changeDiff(diff, duration) {
    //     const value = transY.get() + diff - initScrollHeight
    //     if (typeof duration == 'number') {
    //       const idx = Math.round(value / rowHeight)
    //       let nValue = initScrollHeight + idx * rowHeight

    //       transY.changeTo(nValue, new TweenAnimationConfig(
    //         duration,
    //         scrollFn
    //       ), {
    //         onProcess: aUpdate,
    //         onFinish(v) {
    //           if (v) {
    //             aUpdate(transY.get())
    //           }
    //         },
    //       })
    //     } else {
    //       transY.changeTo(value + initScrollHeight)
    //       diffUpdate(value)
    //     }
    //   },
    //   momentum
    // }),
    stopScroll(toCurrent?: boolean) {
      const ato = transY.getAnimateTo()
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
    wrapperAdd(n: number, config?: AnimationConfig, event?: AnimateFrameEvent) {
      if (n) {
        if (transY.getAnimateTo() || !config) {
          addIndex(n)
        } else {
          transY.changeTo(initScrollHeight, config, {
            ...event,
            from: initScrollHeight + n * rowHeight
          })
          flushSync(() => {
            addIndex(n)
          })
        }
      }
    }
  }
}




