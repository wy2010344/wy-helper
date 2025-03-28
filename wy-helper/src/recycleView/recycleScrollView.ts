import { AnimateSignal, AnimationTime, DeltaXSignalAnimationConfig, FrictionalFactory } from "../animation"
import { SetValue } from "../setStateHelper"
export function getIdxWith(diff: number, rowHeight: number) {
  // let idx = 0
  // if (diff >= rowHeight) {
  //   // idx = -Math.ceil(diff / rowHeight)
  //   // idx = -Math.floor(diff / rowHeight)
  //   idx = -Math.round(diff / rowHeight)
  // } else if (diff <= -rowHeight) {
  //   // idx = -Math.floor(diff / rowHeight)
  //   //后面两个步进都是1,第1个步进是2,即1.1时就进2准备着,可以减少空白
  //   // idx = -Math.ceil(diff / rowHeight)
  //   idx = -Math.round(diff / rowHeight)
  // }
  // return idx
  /**因为浮点误差,用四舍去五入最合适 */
  return -Math.round(diff / rowHeight)
}

/**
 * 使用css如flex居中,不用控制initScrollHeight
 * @param addIndex 
 * @param rowHeight 
 * @param transY 
 * @returns 
 */
export function recicleScrollViewView(
  addIndex: (n: number, immediately?: boolean) => void,
  rowHeight: number,
  transY: AnimateSignal
) {
  let nextTarget = 0
  function aUpdate(value: number) {
    const diff = value
    const idx = getIdxWith(diff, rowHeight)
    if (idx) {
      transY.silentDiff(idx * rowHeight)
      addIndex(idx, true)
    }
  }

  function updateIndex(idx: number, getConfig: DeltaXSignalAnimationConfig, onProcess?: SetValue<number>) {
    nextTarget = idx * rowHeight
    return transY.changeTo(nextTarget, getConfig, function (v) {
      aUpdate(v)
      onProcess?.(v)
    })
  }
  return {
    trans: transY,
    /**
     * 偏移量
     * @param moveY 
     */
    moveUpdate(diff: number) {
      const target = diff + transY.get()
      transY.set(target)
      aUpdate(target)
    },
    //速度
    endMove(
      idealDistance: number,
      getConfig: DeltaXSignalAnimationConfig
    ) {
      const value = transY.get() + idealDistance
      const idx = Math.round(value / rowHeight)
      updateIndex(idx, getConfig)
    },
    stopScroll(toCurrent?: boolean) {
      let ato = transY.onAnimation()
      if (ato) {
        let nValue = nextTarget
        if (toCurrent) {
          const v = transY.get()
          const idx = Math.round(v / rowHeight)
          nValue = idx * rowHeight
        }
        transY.set(nValue)
        aUpdate(nValue)
      }
    },
    containerAdd(n: number, config?: DeltaXSignalAnimationConfig, event?: SetValue<number>) {
      if (n) {
        if (config) {
          return updateIndex(-n, config, event)
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
        getConfig: DeltaXSignalAnimationConfig
      ) => void,
      velocity: number
    ) {
      endMove(fc.getFromVelocity(velocity).distance, distance => {
        return fc.getFromDistance(distance).animationConfig()
      })
    },
    distanceConfig(n: number) {
      return fc.getFromDistance(n).animationConfig()
    }
  }
}