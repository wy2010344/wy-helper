import { SetValue } from "../setStateHelper"
import { getMaxScroll } from "./util"
export * from './bscroll'
export * from './iscroll'
export { getMaxScroll } from './util'
export interface EaseItem {
  style: string
  fn: EaseFn
}
export interface EaseFn {
  (t: number): number
}

export const scrollEases = {
  quadratic: {
    style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fn(t: number) {
      return t * (2 - t)
    }
  },
  circular: {
    style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',	// Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
    fn(k: number) {
      return Math.sqrt(1 - (--k * k));
    }
  },
  back: {
    style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    fn(k: number) {
      var b = 4;
      return (k = k - 1) * k * ((b + 1) * k + b) + 1;
    }
  },
  bounce: {
    style: '',
    fn(k: number) {
      if ((k /= 1) < (1 / 2.75)) {
        return 7.5625 * k * k;
      } else if (k < (2 / 2.75)) {
        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
      } else if (k < (2.5 / 2.75)) {
        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
      } else {
        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
      }
    }
  },
  elastic: {
    style: '',
    fn(k: number) {
      var f = 0.22,
        e = 0.4;

      if (k === 0) { return 0; }
      if (k == 1) { return 1; }

      return (e * Math.pow(2, - 10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
    }
  }
}

export interface MomentumCall {
  (arg: MomentumEndArg): MomentumCallOut
}
export interface MomentumJudge {
  (arg: MomentumEndArg): {
    type: "scroll" | "scroll-edge" | "edge-back"
    from: number
    target: number
  }
}
export interface MomentumEndArg {
  /** < 0 当前位移 */
  current: number,
  /**
   * 负是向上,正是向下
   */
  velocity: number,
  /**最上滚动,一般为0 */
  // lowerMargin?: number,
  /**最下滚动,一般为wrapperHeight-clientHeight,即maxScroll,为负数 */
  // upperMargin: number,
  // /** 容器尺寸,如wrapperHeight  */
  containerSize: number,
  contentSize: number
  // maxScroll: number
}
export type MomentumCallOut = {
  /**滚动 */
  type: "scroll"
  from: number
  target: number
  duration: number
} | {
  /**从外部滚回边界 */
  type: "edge-back"
  from: number
  target: number
} | {
  /**滚动到容器外,可能需要回退 */
  type: "scroll-edge"
  from: number
  target: number
  finalPosition: number
  duration: number
}


// export function changeWithFixWidth({
//   translateY,
//   lineHeight,
//   getLength,
//   setIndex,
//   getBackConfig,
//   getConfig
// }: {
//   translateY: AnimateSignal,
//   lineHeight: number,
//   getLength(): number,
//   setIndex(n: number): void,
//   getBackConfig(distance: number): GetDeltaXAnimationConfig,
//   getConfig(duration: number): GetDeltaXAnimationConfig
// }) {
//   function changeValue(n: number) {
//     const index = Math.round(n * -1 / lineHeight)
//     if (index < 0 || index >= getLength()) {
//       return
//     }
//     setIndex(index)
//   }
//   const event: AnimateFrameEvent = {
//     onProcess: changeValue,
//     onFinish(v) {
//       const value = translateY.get()
//       changeValue(value)
//     },
//   }
//   return {
//     changeValue,
//     onFinish(out: MomentumCallOut) {
//       if (out.type == 'scroll') {
//         const index = -Math.round(out.target / lineHeight)
//         const value = index * lineHeight * -1
//         animateSignalChangeTo(translateY,value,)
//         translateY.changeTo(value, getConfig(out.duration), event)
//       } else if (out.type == 'scroll-edge') {
//         translateY.changeTo(out.target, getConfig(out.duration), {
//           onProcess: event.onProcess,
//           onFinish(v) {
//             event.onFinish?.(v)
//             translateY.changeTo(out.finalPosition, getBackConfig(Math.abs(out.target - out.finalPosition)), event)
//           },
//         })
//       } else if (out.type == 'edge-back') {
//         translateY.changeTo(out.target, getBackConfig(Math.abs(out.from - out.target)), event)
//       }
//     }
//   }
// }

// export type OldGetValue = {
//   getOnDragEnd(duration: number, deltaX: number, edge: boolean): AnimationConfig
//   onEdgeBack(deltaX: number): AnimationConfig
// }

export type WithTimeStampEvent = {
  timeStamp: number
}

type ScrollDelta = (delta: number, velocity: number) => void

/**
 * 将拖动的page定位转化成scroll
 * @param page 
 */
export class ScrollFromPage<T extends WithTimeStampEvent> {
  private lastPage: number
  constructor(
    private lastEvent: T,
    private getPage: (n: T) => number,
    private scrollDelta: ScrollDelta,
    private onFinish: SetValue<number>
  ) {
    this.lastPage = getPage(lastEvent)
  }
  static from<T extends WithTimeStampEvent>(e: T, arg: {
    getPage(n: T): number,
    scrollDelta: ScrollDelta,
    onFinish: SetValue<number>
  }) {
    return new ScrollFromPage(
      e,
      arg.getPage,
      arg.scrollDelta,
      arg.onFinish
    )
  }
  private velocity = 0
  onMove(e: T) {
    this.inMove(e, true)
    return this.velocity
  }
  onEnd(e: T) {
    this.inMove(e)
    this.onFinish(this.velocity)
    return this.velocity
  }
  private inMove(e: T, cVelocity?: boolean) {
    const page = this.getPage(e)
    //拖拽与之相反
    const delta = this.lastPage - page
    const diffTime = e.timeStamp - this.lastEvent.timeStamp
    if (cVelocity && diffTime > 0) {
      this.velocity = delta / diffTime
    }
    this.lastEvent = e
    if (delta) {
      this.scrollDelta(delta, this.velocity)
      this.lastPage = page
    }
  }
}

export function eventGetPageY<T extends {
  pageY: number
}>(e: T) {
  return e.pageY
}

export function eventGetPageX<T extends {
  pageX: number
}>(e: T) {
  return e.pageX
}


export function overScrollSlow(
  current: number,
  delta: number,
  containerSize: number,
  contentSize: number,
  slow = 3
) {
  const maxScroll = getMaxScroll(containerSize, contentSize)
  if (current > 0 && current < maxScroll) {
    return delta
  }
  return delta / slow
}


/**
 * 
 * @param idealDistance 理想的惯性位移位置,通常是MomentumIScroll.get().getWithSpeedIdeal(velocityX).distance  + deltaX
 * @param width 容器宽度
 * @returns 1向左,0不动,-1向右
 */
export function scrollJudgeDirection(
  idealDistance: number,
  width: number
) {
  // const targetDis = MomentumIScroll.get().getWithSpeedIdeal(velocityX).distance  + deltaX
  const absTargetDis = Math.abs(idealDistance)
  if (absTargetDis < width / 2) {
    return 0
  } else {
    if (idealDistance < 0) {
      return 1
    }
    return -1
  }
}
/**
 * 
 * @param velocityX 速度
 * @param deltaX 位移
 * @param width 宽度
 * @param VELOCITY_THRESHOLD 容错
 * @returns 1 向右移动 -1向左移动
 * 
 * @deprecated 使用iScroll.getWithSpeedIdeal计算出理想位移,再与中点进行比较,偏移中点或越界,才进行翻页
 */
// export function scrollJudgeDirection(
//   velocityX: number,
//   deltaX: number,
//   width: number,
//   {
//     VELOCITY_THRESHOLD = 0.1,
//     DELTA_THRESHOLD = width / 2
//   }: {
//     VELOCITY_THRESHOLD?: number
//     DELTA_THRESHOLD?: number
//   } = emptyObject) {
//   let directionX = 0;
//   // Used in SwipeView.handlePanStart for hasty swipes
//   if (Math.abs(velocityX) > VELOCITY_THRESHOLD) {
//     directionX = velocityX > 0 ? 1 : -1;
//     // If drag started towards one end (directionX determined by velocityX at dragEnd)
//     // but ends towards the opposite (deltaX determined by the diff between dragStart and dragEnd),
//     // we shall ignore the swipe intention.
//     if ((directionX > 0 && deltaX < 0) || (directionX < 0 && deltaX > 0)) {
//       directionX = 0;
//     }
//   } else if (Math.abs(deltaX) >= DELTA_THRESHOLD) {
//     directionX = deltaX > 0 ? 1 : -1;
//   }
//   return -directionX
// }




class CacheVelocity {
  constructor(
    public readonly BEFORE_LAST_KINEMATICS_DELAY = 32
  ) { }
  private list: {
    time: number,
    value: number
  }[] = []
  private velocity = 0
  getIdx(time: number) {
    for (let i = 0; i < this.list.length; i++) {
      const row = this.list[i]
      let diffTime = time - row.time
      if (diffTime > this.BEFORE_LAST_KINEMATICS_DELAY) {
        return i
      }
    }
    return this.list.length - 1
  }
  clear() {
    this.list.length = 0
    this.velocity = 0
  }
  reset(time: number, value: number) {
    this.clear()
    return this.append(time, value)
  }
  append(time: number, value: number) {
    if (this.list.length) {
      let idx = this.getIdx(time)
      const cell = this.list[idx]
      if (time != cell.time) {
        this.velocity = (value - cell.value) / (time - cell.time)
        this.list.length = idx + 1
      }
    } else {
      this.velocity = 0
    }
    this.list.unshift({
      time,
      value
    })
    return this.velocity
  }
  get() {
    return this.velocity
  }
}
export type DragSnapParam = {
  beforeDiff?: number
  //在这块区域内前面的吸附力
  beforeForce?: number
  size: number
  //在这块区域内后面的吸附力
  afterForce?: number
  afterDiff?: number
}
export function dragSnapWithList(list: DragSnapParam[]) {
  const newList: {
    beforeDiff: number
    beforeForce: number
    afterForce: number
    size: number
    afterDiff: number
  }[] = []
  list.forEach(function (row) {
    if (row.size <= 0) {
      console.warn('尺寸必须大于0!故不参与', row)
    } else {
      let beforeForce = row.beforeForce || 0
      if (beforeForce < 0) {
        console.log('beforeForce不能小于0,识别为0', row)
        beforeForce = 0
      }
      let afterForce = row.afterForce || 0
      if (afterForce < 0) {
        console.log('afterForce不能小于0,识别为0', row)
        afterForce = 0
      }
      newList.push({
        beforeDiff: row.beforeDiff || 0,
        size: row.size,
        beforeForce,
        afterForce,
        afterDiff: row.afterDiff || 0
      })
    }
  })
  /**
   * 入值与返回值都是正
   * 在拖拽场合,一般要转为负,即进负出负
   */
  return function (n: number) {
    let acc = 0
    for (let i = 0; i < newList.length; i++) {
      const cell = newList[i]
      let nextAcc = acc + cell.size
      if (acc < n && n < nextAcc) {
        //在什么区域返回
        const totalForce = cell.beforeForce + cell.afterForce
        if (totalForce) {
          const pc = cell.beforeForce * cell.size / totalForce
          if (n - acc > pc) {
            return nextAcc + cell.afterDiff
          }
          return acc + cell.beforeDiff
        }
      }
      nextAcc = acc
    }
    return n
  }
}