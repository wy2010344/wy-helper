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
    minScroll = 0,
    maxScroll,
    scroll,
    frictional,
    // velocity,
    // containerSize,
    // contentSize,
    scrollToEdge,
    edgeConfig = ClampingScrollFactory.edgeClampingConfig,
    edgeBackConfig = defaultSpringAnimationConfig,
    targetSnap = quote,
    getForceStop = defaultGetForceStop,
    onProcess,
    onOutProcess
  }: {
    minScroll?: number
    maxScroll: number
    scroll: AnimateSignal,

    frictional: ScrollHelper,

    /**滚动到边界,是否滚出去 */
    scrollToEdge?(velocity: number, edge: number): boolean | void
    edgeConfig?(velocity: number): AnimateSignalConfig
    edgeBackConfig?: DeltaXSignalAnimationConfig
    /**吸附 */
    targetSnap?: (n: number) => number

    /**获得强制吸附的位置 */
    getForceStop?: (current: number, idealTarget: number) => number
    onProcess?: SetValue<number>
    onOutProcess?: SetValue<number>
  }) {
  const current = scroll.get()
  if (minScroll <= current && current <= maxScroll) {
    const idealTarget = current + frictional.distance
    const forceStop = getForceStop(current, idealTarget)
    const destination = targetSnap(forceStop)


    let elapsedTime = 0
    let edge = 0

    if (destination < minScroll) {
      elapsedTime = frictional.getTimeToDistance(minScroll - current)
      edge = minScroll
    } else if (destination > maxScroll) {
      elapsedTime = frictional.getTimeToDistance(maxScroll - current)
      edge = maxScroll
    }
    if (elapsedTime) {
      const edgeVelocity = frictional.getVelocity(elapsedTime)
      const step1 = await scroll.change(
        frictional.animationConfig(elapsedTime),
        onProcess,
        edge)
      if (step1) {
        //到达边界
        if (scrollToEdge?.(edgeVelocity, edge)) {
          return false
        }
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
    //拉到容许区域外
    return scroll.animateTo(
      getDestination(current, minScroll, maxScroll),
      edgeBackConfig,
      onProcess)
  }
}


function defaultGetForceStop(current: number, idealTarget: number) {
  return idealTarget
}
