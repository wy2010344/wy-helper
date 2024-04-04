import { AnimationConfig, EaseFn, EmptyFun, MomentumCallIdeal, buildNoEdgeScroll } from "wy-helper";
import { AnimateFrameEvent, animateNumberFrame, animateNumberSilientChangeDiff } from "./animation";





export function recicleScrollViewView(
  flushSync: (fun: EmptyFun) => void,
  addIndex: (n: number) => void,
  rowHeight: number,
  momentum: MomentumCallIdeal,
  scrollFn: EaseFn,
  transY = animateNumberFrame(0)
) {
  let initScrollHeight = 0
  function commitIdx(idx: number) {
    if (idx) {
      flushSync(() => {
        addIndex(idx)
      })
      animateNumberSilientChangeDiff(transY, idx * rowHeight)
    }
  }
  function diffUpdate(v: number) {
    const diff = v - initScrollHeight
    let idx = 0
    if (diff >= rowHeight) {
      idx = -Math.floor(diff / rowHeight)
    } else if (diff <= -rowHeight) {
      idx = -Math.ceil(diff / rowHeight)
    }
    commitIdx(idx)
  }
  return {
    trans: transY,
    setInitScrollHeight(n: number) {
      initScrollHeight = n
      transY.changeTo(n)
    },
    scroll: buildNoEdgeScroll({
      changeDiff(diff, duration) {
        const value = transY.get() + diff
        if (typeof duration == 'number') {
          const idx = Math.round((value - initScrollHeight) / rowHeight)
          let nValue = initScrollHeight + idx * rowHeight
          transY.changeTo(nValue, {
            duration,
            fn: scrollFn
          }, {
            onProcess: diffUpdate,
            onFinish(v) {
              if (v) {
                diffUpdate(transY.get())
              }
            },
          })
        } else {
          transY.changeTo(value)
          diffUpdate(value)
        }
      },
      momentum
    }),
    wrapperAdd(n: number, config?: AnimationConfig, event?: AnimateFrameEvent<number>) {
      if (n) {
        if (transY.getAnimateTo() || !config) {
          addIndex(n)
        } else {
          flushSync(() => {
            addIndex(n)
          })
          transY.changeTo(initScrollHeight + n * rowHeight)
          transY.changeTo(initScrollHeight, config, event)
        }
      }
    }
  }
}