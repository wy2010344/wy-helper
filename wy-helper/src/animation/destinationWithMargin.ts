import { getDestination, getMaxScroll } from '../scroller/util'
import { SetValue } from '../setStateHelper'
import { quote } from '../util'
import { AnimateSignal, AnimateSignalConfig } from './animateSignal'
import { defaultSpringAnimationConfig, DeltaXSignalAnimationConfig } from './AnimationConfig'
import { ClampingScrollFactory } from './clamping'


export interface ScrollHelper {
  distance: number
  /**
   * 根据位移求所需要的时间,临界阻尼(iOS)无法用初等函数直接求解
   * @param distance 
   */
  getTimeToDistance(distance: number): number
  getVelocity(time: number): number
  animationConfig(duration?: number): AnimateSignalConfig
  cloneFromDistance(distance: number): ScrollHelper
}
export async function destinationWithMargin(
  {
    scroll,
    frictional,
    // velocity,
    containerSize,
    contentSize,
    edgeConfig = ClampingScrollFactory.edgeClampingConfig,
    edgeBackConfig = defaultSpringAnimationConfig,
    targetSnap = quote,
    getForceStop = defaultGetForceStop,
    onProcess,
    onOutProcess
  }: {
    scroll: AnimateSignal,

    frictional: ScrollHelper,

    containerSize: number,
    contentSize: number


    edgeConfig?(velocity: number): AnimateSignalConfig
    edgeBackConfig?: DeltaXSignalAnimationConfig
    /**吸附 */
    targetSnap?: (n: number) => number
    /**获得强制吸附的位置 */
    getForceStop?: (current: number, idealTarget: number) => number
    onProcess?: SetValue<number>
    onOutProcess?: SetValue<number>
  }) {
  const lowerMargin = 0
  const upperMargin = getMaxScroll(containerSize, contentSize)
  // const frictional = this.getFromVelocity(velocity)
  const current = scroll.get()
  if (lowerMargin < current && current < upperMargin) {
    const idealTarget = current + frictional.distance
    const forceStop = getForceStop(current, idealTarget)
    const destination = targetSnap(forceStop)
    let elapsedTime = 0
    let edge = 0

    if (destination < lowerMargin) {
      elapsedTime = frictional.getTimeToDistance(lowerMargin - current)
      edge = lowerMargin
    } else if (destination > upperMargin) {
      elapsedTime = frictional.getTimeToDistance(upperMargin - current)
      edge = upperMargin
    }
    if (elapsedTime) {
      const edgeVelocity = frictional.getVelocity(elapsedTime)
      const step1 = await scroll.change(
        frictional.animationConfig(elapsedTime),
        onProcess,
        edge)
      if (step1) {
        const step2 = await scroll.change(
          edgeConfig(edgeVelocity),
          onOutProcess)
        if (step2) {
          return scroll.animateTo(
            edge,
            edgeBackConfig,
            onOutProcess)
        }
      }
      return false
    } else {
      //另一种方法,最后速度到一定程度,转为spring动画
      if (destination == idealTarget) {
        return scroll.change(
          frictional.animationConfig(),
          onProcess,
          destination)
      } else {
        return scroll.change(
          frictional.cloneFromDistance(destination - current).animationConfig(),
          onProcess,
          destination)
      }
    }
  } else {
    return scroll.animateTo(
      getDestination(current, lowerMargin, upperMargin),
      edgeBackConfig,
      onProcess)
  }
}


function defaultGetForceStop(current: number, idealTarget: number) {
  return idealTarget
}
