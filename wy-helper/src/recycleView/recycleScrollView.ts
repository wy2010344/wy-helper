import { AnimateFrameEvent, AnimateFrameValue, GetDeltaXAnimationConfig } from "../animation"
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
      getConfig: GetDeltaXAnimationConfig
    ) {
      // const fc = new FrictionalFactory()
      // fc.getFromVelocity(v).maxDistance 
      const value = transY.get() + idealDistance - initScrollHeight
      const idx = Math.round(value / rowHeight)
      const nValue = idx * rowHeight + initScrollHeight
      transY.changeTo(nValue, getConfig, {
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
    stopScroll(toCurrent?: boolean) {
      let ato = transY.getAnimateTo()
      if (ato?.hasTarget()) {
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




