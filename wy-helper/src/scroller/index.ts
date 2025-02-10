import { AbsAnimateFrameValue, AnimateFrameEvent, AnimationConfig, GetDeltaXAnimationConfig } from "../animation"
import { emptyObject } from "../util"
export * from './bscroll'
export * from './iscroll'

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
export interface MomentumCallIdeal {
  (t: number): AnimationConfig
}
export interface MomentumEndArg {
  /** < 0 当前位移 */
  current: number,
  velocity: number,
  /**最下滚动,一般为wrapperHeight-clientHeight,即maxScroll,为负数 */
  lowerMargin: number,
  /**最上滚动,一般为0 */
  upperMargin: number,
  // /** 容器尺寸,如wrapperHeight  */
  containerSize: number,
}
export interface MomentumJudgeBack {
  type: "scroll" | "scroll-edge" | "edge-back"
  from: number
  target: number
}

export type MomentumCallOut = {
  type: "scroll"
  from: number
  target: number
  duration: number
} | {
  type: "edge-back"
  from: number
  target: number
} | {
  type: "scroll-edge"
  from: number
  target: number
  finalPosition: number
  duration: number
}


export function changeWithFixWidth({
  translateY,
  lineHeight,
  getLength,
  setIndex,
  getBackConfig,
  getConfig
}: {
  translateY: AbsAnimateFrameValue,
  lineHeight: number,
  getLength(): number,
  setIndex(n: number): void,
  getBackConfig(distance: number): GetDeltaXAnimationConfig,
  getConfig(duration: number): GetDeltaXAnimationConfig
}) {
  function changeValue(n: number) {
    const index = Math.round(n * -1 / lineHeight)
    if (index < 0 || index >= getLength()) {
      return
    }
    setIndex(index)
  }
  const event: AnimateFrameEvent = {
    onProcess: changeValue,
    onFinish(v) {
      const value = translateY.get()
      changeValue(value)
    },
  }
  return {
    changeValue,
    onFinish(out: MomentumCallOut) {
      if (out.type == 'scroll') {
        const index = -Math.round(out.target / lineHeight)
        const value = index * lineHeight * -1
        translateY.changeTo(value, getConfig(out.duration), event)
      } else if (out.type == 'scroll-edge') {
        translateY.changeTo(out.target, getConfig(out.duration), {
          onProcess: event.onProcess,
          onFinish(v) {
            event.onFinish?.(v)
            translateY.changeTo(out.finalPosition, getBackConfig(Math.abs(out.target - out.finalPosition)), event)
          },
        })
      } else if (out.type == 'edge-back') {
        translateY.changeTo(out.target, getBackConfig(Math.abs(out.from - out.target)), event)
      }
    }
  }
}

export type OldGetValue = {
  getOnDragEnd(duration: number, deltaX: number, edge: boolean): AnimationConfig
  onEdgeBack(deltaX: number): AnimationConfig
}

export function startScroll(
  n: number,
  {
    beginTime = performance.now(),
    edgeSlow = 3,
    upperScrollDiff = 0,
    lowerScrollDiff = 0,
    containerSize,
    contentSize,
    getCurrentValue,
    changeTo,
    finish
  }: {
    beginTime?: number
    /**到达边缘时拖拽减速 */
    edgeSlow?: number
    upperScrollDiff?: number
    lowerScrollDiff?: number
    //滚动容器
    containerSize(): number
    //滚动内容
    contentSize(): number
    getCurrentValue(): number
    changeTo(value: number): void
    finish(v: MomentumEndArg): void
  }) {
  const beginValue = n
  let latestValue = beginValue
  function setMove(n: number) {
    let diff = n - latestValue
    const cv = getCurrentValue()
    if (diff) {
      const { lowerMargin, upperMargin } = getMargin()
      if (!(cv < upperMargin && cv > lowerMargin)) {
        diff = diff / edgeSlow
      }
      const newValue = cv + diff
      changeTo(newValue)
      latestValue = n
      return newValue
    } else {
      return cv
    }
  }
  function getMargin() {
    const maxScroll = Math.min(containerSize() - contentSize(), 0)
    const upperMargin = upperScrollDiff
    const lowerMargin = maxScroll + lowerScrollDiff
    return {
      upperMargin,
      lowerMargin,
      maxScroll
    }
  }
  return {
    move(n: number) {
      return setMove(n)
    },
    end(n?: number, velocity?: number) {
      if (typeof n != 'number') {
        n = latestValue
      }
      const newY = setMove(n)
      const { lowerMargin, upperMargin } = getMargin()
      if (typeof velocity != 'number') {
        velocity = (n - beginValue) / (performance.now() - beginTime) //默认使用平均速度,因为最后的瞬间速度可能为0?
      }
      finish({
        current: newY,
        velocity,
        lowerMargin,
        upperMargin,
        containerSize: containerSize()
      })
    }
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
export function scrollJudgeDirection(
  velocityX: number,
  deltaX: number,
  width: number,
  {
    VELOCITY_THRESHOLD = 0.1,
    DELTA_THRESHOLD = width / 2
  }: {
    VELOCITY_THRESHOLD?: number
    DELTA_THRESHOLD?: number
  } = emptyObject) {
  let directionX = 0;
  // Used in SwipeView.handlePanStart for hasty swipes
  if (Math.abs(velocityX) > VELOCITY_THRESHOLD) {
    directionX = velocityX > 0 ? 1 : -1;
    // If drag started towards one end (directionX determined by velocityX at dragEnd)
    // but ends towards the opposite (deltaX determined by the diff between dragStart and dragEnd),
    // we shall ignore the swipe intention.
    if ((directionX > 0 && deltaX < 0) || (directionX < 0 && deltaX > 0)) {
      directionX = 0;
    }
  } else if (Math.abs(deltaX) >= DELTA_THRESHOLD) {
    directionX = deltaX > 0 ? 1 : -1;
  }
  return -directionX
}




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
export function cacheVelocity(BEFORE_LAST_KINEMATICS_DELAY = 32) {
  return new CacheVelocity(BEFORE_LAST_KINEMATICS_DELAY)
}