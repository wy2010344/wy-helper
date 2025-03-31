import { AnimateSignalConfig, batchSignalEnd, emptyFun, emptyObject, getMaxScroll, SetValue, StoreRef } from ".."
import { AnimateSignal, SilentDiff, SubscribeRequestAnimationFrame } from "./animateSignal"


export function physicalAnimationFrame(
  callback: () => any,
  /**间隔 */
  iter = 1
) {
  let lastTime = performance.now()
  return function (time: number) {
    const diff = Math.round((time - lastTime) / iter)
    for (let i = 0; i < diff; i++) {
      if (callback()) {
        return true
      }
    }
    lastTime = time
  }
}
//0.99一次416格左右,每格44px0.,9972,一次208格左右
function defaultNextVelocity(n: number) {
  return n * 0.9978
}

/**
 * 迭代版的无限滚动,下次速度与上次速度有关
 *  下次速度与上次速度无关:使用函数式动画
 * @param physicalAnimate 
 * @returns 
 */
export function scrollInfinityIteration(
  velocity: number,
  {
    nextVelocity = defaultNextVelocity,
    minVelocityThreshold = defaultMinVelocityThreshold,
  }: {
    nextVelocity?(n: number): number
    minVelocityThreshold?: number
  } = emptyObject
): AnimateSignalConfig {
  return function (
    out: SilentDiff
  ) {
    if (Math.abs(velocity) < minVelocityThreshold) {
      return
    }
    let accValue = 0
    return physicalAnimationFrame(
      function () {
        if (Math.abs(velocity) < minVelocityThreshold) {
          return true
        }
        velocity = nextVelocity(velocity)
        accValue = accValue + velocity
        out.setDisplayment(accValue)
      }
    )
  }
}


export function defaultEdgeNextVelocity(n: number) {
  return n * 0.93
}

const defaultMinVelocityThreshold = 0.08


interface EdgeIterationArg {
  containerSize: number
  contentSize: number
  velocity: number
  nextVelocity?(n: number): number
  edgeNextVelocity?(n: number): number
  minVelocityThreshold?: number
}

/**
 * 需要外部停止动画,比如滚动未停止,但另一个方向的滚动已经发生了,就需要它停止
 * 比较的是速度,而不是位移,可以安全更新,但不能重新计算...
 *  下次速度与上次速度无关,需要函数动画
 * @param physicalAnimate 
 * @returns 
 */
function scrollEdgeIterationFn({
  containerSize,
  contentSize,
  velocity,
  nextVelocity = defaultNextVelocity,
  edgeNextVelocity = defaultEdgeNextVelocity,
  minVelocityThreshold = defaultMinVelocityThreshold,
}: EdgeIterationArg, onBack: (target: number, velocity: number) => void): AnimateSignalConfig {
  minVelocityThreshold = Math.abs(minVelocityThreshold) || defaultMinVelocityThreshold
  return function (
    out: SilentDiff
  ) {
    const current = out.getCurrent()
    if (current < 0 && velocity >= 0) {
      onBack(0, velocity)
      return
    }
    const maxScroll = getMaxScroll(containerSize, contentSize)
    if (current > maxScroll && velocity <= 0) {
      onBack(maxScroll, velocity)
      return
    }
    let accValue = 0
    function addVelocity(value: number) {
      accValue = accValue + value
      out.setDisplayment(accValue)
    }
    return physicalAnimationFrame(
      function () {
        const current = out.getCurrent()
        if (current < 0) {
          if (velocity < 0) {
            //惯性向边
            velocity = edgeNextVelocity(velocity)
            addVelocity(velocity)
            if (velocity > -minVelocityThreshold) {
              //回弹,可以直接使用spring动画或其它
              onBack(0, velocity = minVelocityThreshold)
              return true
            }
          } else {
            onBack(0, velocity)
            return true
          }
        } else if (current > maxScroll) {
          if (velocity > 0) {
            velocity = edgeNextVelocity(velocity)
            addVelocity(velocity)
            if (velocity < minVelocityThreshold) {
              //回弹,可以直接使用spring动画或其它
              onBack(maxScroll, minVelocityThreshold - velocity)
              return true
            }
          } else {
            onBack(maxScroll, velocity)
            return true
          }
        } else {
          if (Math.abs(velocity) < minVelocityThreshold) {
            return true
          }
          velocity = nextVelocity(velocity)
          addVelocity(velocity)
        }
      })
  }

}

/**
 * 有一个缺点,由于是迭代的,不知道中止位置,当连续滚动时,不能定位到上一次的结尾
 */
export async function scrollEdgeIteration(
  scroll: AnimateSignal,
  arg: EdgeIterationArg
) {
  let backTarget = 0, backVelocity = 0, then = false
  const value = await scroll.change(scrollEdgeIterationFn(arg, function (target, velocity) {
    backTarget = target
    backVelocity = velocity
    then = true
  }))
  if (value && then) {
    return {
      target: backTarget,
      velocity: backVelocity
    }
  }
}

