import { SetValue } from "./setStateHelper"
import { emptyObject } from "./util"

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
  (
    /** < 0 当前位移 */
    current: number,
    velocity: number,
    /** 容器尺寸,如wrapperHeight  */
    wrapperSize: number,
    /**最下滚动,一般为wrapperHeight-clientHeight,即maxScroll,为负数 */
    lowerMargin: number,
    /**最上滚动,一般为0 */
    upperMargin: number
  ): {
    /**目标位移 */
    destination: number
    /**到目标位移用时 */
    duration: number
  }
}


export interface MomentumCallIdeal {
  (velocity: number): {
    distance: number
    duration: number
  }
}


export class MomentumIScroll {
  private constructor(
    public readonly deceleration = 0.0006
  ) {
    this.deceleration = Math.abs(deceleration)
  }
  /**
   * 通过速度获得理想的信息
   * @param velocity 
   * @returns 
   */
  getWithSpeedIdeal(velocity: number) {
    const absSpeed = Math.abs(velocity)
    //速度除以减速度,得变成0的时间
    const duration = absSpeed / this.deceleration;
    //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
    const distance = duration * (absSpeed / 2) * (velocity < 0 ? -1 : 1);

    return {
      absSpeed,
      distance,
      duration
    }
  }

  /**
   * 通过位移倒推速度和时间
   * @param distance 
   * @returns 
   */
  getWithDistanceIdeal(distance: number) {
    const speed = Math.cbrt(distance * 2 * this.deceleration)
    const duration = Math.abs(speed / this.deceleration)
    return {
      speed,
      duration
    }
  }

  /**
   * 有边界的情况
   * @param current 
   * @param velocity 
   * @param wrapperSize 
   * @param lowerMargin 
   * @param upperMargin 
   * @returns 
   */
  getDestinationWithMargin(
    current: number,
    /**速度,可能为负数*/
    velocity: number,
    wrapperSize: number,
    lowerMargin: number,
    upperMargin: number
  ) {
    let { absSpeed, duration, distance } = this.getWithSpeedIdeal(velocity)
    //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
    let destination = current + distance
    //超出边界的时间,减少位移
    if (destination < lowerMargin) {
      destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (absSpeed / 8)) : lowerMargin;
      let distance = Math.abs(destination - current);
      duration = distance / absSpeed;
    } else if (destination > upperMargin) {
      destination = wrapperSize ? wrapperSize / 2.5 * (absSpeed / 8) : upperMargin;
      let distance = Math.abs(current) + destination;
      duration = distance / absSpeed;
    }

    return {
      destination: Math.round(destination),
      duration: duration
    };
  }
  static readonly default = new MomentumIScroll()
  static get(deceleration?: number) {
    let iScroll: MomentumIScroll
    if (!deceleration || deceleration == MomentumIScroll.default.deceleration) {
      iScroll = MomentumIScroll.default
    } else {
      iScroll = new MomentumIScroll(deceleration)
    }
    return iScroll
  }
}



export class MomentumBScoll {

  constructor(
    //表示 momentum 动画的减速度。
    public readonly deceleration = 0.0015,
    //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
    public readonly swipeBounceTime = 500,
    //设置 momentum 动画的动画时长。
    public readonly swipeTime = 2500
  ) { }
  getWithSpeedIdeal(velocity: number) {

    const duration = Math.min(this.swipeTime, (velocity * 2) / this.deceleration)
    return {
      distance: ((velocity * velocity) / this.deceleration) * (velocity < 0 ? -1 : 1),
      duration
    }
  }

  getDestinationWithMargin(
    current: number,
    /**速度,可能为负数*/
    velocity: number,
    wrapperSize: number,
    lowerMargin: number,
    upperMargin: number
  ) {

    let { distance, duration } = this.getWithSpeedIdeal(velocity)
    let destination = current + distance
    let rate = 15
    if (destination < lowerMargin) {
      destination = wrapperSize
        ? Math.max(
          lowerMargin - wrapperSize / 4,
          lowerMargin - (wrapperSize / rate) * velocity
        )
        : lowerMargin
      duration = this.swipeBounceTime
    } else if (destination > upperMargin) {
      destination = wrapperSize
        ? Math.min(
          upperMargin + wrapperSize / 4,
          upperMargin + (wrapperSize / rate) * velocity
        )
        : upperMargin
      duration = this.swipeBounceTime
    }
    return {
      destination: Math.round(destination),
      duration: duration
    }
  }

  static readonly default = new MomentumBScoll()
  static get(arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
    //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
    swipeBounceTime?: number,
    //设置 momentum 动画的动画时长。
    swipeTime?: number
  } = emptyObject) {
    if (!arg) {
      return MomentumBScoll.default
    }
    const d = MomentumBScoll.default
    if ((!arg.deceleration || arg.deceleration == d.deceleration)
      || (!arg.swipeBounceTime || arg.swipeBounceTime == d.swipeBounceTime)
      || (!arg.swipeTime || arg.swipeTime == d.swipeTime)
    ) {
      return d
    }
    return new MomentumBScoll(arg.deceleration, arg.swipeBounceTime, arg.swipeTime)
  }
}



export const momentum = {
  iScroll(arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
  } = emptyObject): MomentumCall {
    const iScroll = MomentumIScroll
      .get(arg.deceleration)
    return function (
      current,
      velocity,
      wrapperSize,
      lowerMargin,
      upperMargin
    ) {
      return iScroll.getDestinationWithMargin(current, velocity, wrapperSize, lowerMargin, upperMargin)
    }
  },
  iScrollIdeal(arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
  } = emptyObject): MomentumCallIdeal {
    const iScroll = MomentumIScroll
      .get(arg.deceleration)
    return function (speed) {
      return iScroll.getWithSpeedIdeal(speed)
    }
  },
  bScroll(
    arg: {
      //表示 momentum 动画的减速度。
      deceleration?: number,
      //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
      swipeBounceTime?: number
      //设置 momentum 动画的动画时长。
      swipeTime?: number
    } = emptyObject
  ): MomentumCall {
    const iScroll = MomentumBScoll
      .get(arg)
    return function (
      current,
      velocity,
      wrapperSize,
      lowerMargin,
      upperMargin
    ) {
      return iScroll.getDestinationWithMargin(current, velocity, wrapperSize, lowerMargin, upperMargin)
    }
  },
  bScrollIdeal(
    arg: {
      //表示 momentum 动画的减速度。
      deceleration?: number,
      //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
      swipeBounceTime?: number
      //设置 momentum 动画的动画时长。
      swipeTime?: number
    } = emptyObject): MomentumCallIdeal {
    const iScroll = MomentumBScoll
      .get(arg)
    return function (speed) {
      return iScroll.getWithSpeedIdeal(speed)
    }
  },
}



export function buildNoEdgeScroll({
  momentum,
  changeDiff
}: {
  momentum: MomentumCallIdeal
  changeDiff(
    diff: number,
    duration?: number): void
}) {
  let moveM: MoveCache | undefined = undefined

  function setMove(last: MoveCache, n: number) {
    let diff = n - last.latestValue
    if (diff) {
      changeDiff(diff)
      last.latestValue = n
    }
  }
  return {
    start(n: number, beginTime = performance.now()) {
      moveM = {
        beginValue: n,
        //不必精确时间,只是用于计算动量
        beginTime,
        latestValue: n
      }
    },
    move(n: number) {
      if (moveM) {
        setMove(moveM, n)
      }
    },
    end(n?: number, velocity?: number) {
      const last = moveM
      if (last) {
        if (typeof n != 'number') {
          n = last.latestValue
        }
        setMove(last, n)
        moveM = undefined
        let currentTime = performance.now()
        if (typeof velocity != 'number') {
          velocity = (n - last.beginValue) / (currentTime - last.beginTime) //默认使用平均速度,因为最后的瞬间速度可能为0?
        }
        const { distance, duration } = momentum(velocity)
        changeDiff(distance, duration)
      }
    }
  }
}

type MoveCache = {
  // value: number
  beginValue: number
  beginTime: number
  latestValue: number
}
export function buildScroll({
  edgeSlow = 3,
  upperScrollDiff = 0,
  lowerScrollDiff = 0,
  wrapperSize,
  containerSize,
  getCurrentValue,
  changeTo,
  momentum,
}: {
  /**到达边缘时拖拽减速 */
  edgeSlow?: number
  upperScrollDiff?: number
  lowerScrollDiff?: number
  //滚动容器
  wrapperSize(): number
  //滚动内容
  containerSize(): number
  getCurrentValue(): number
  changeTo(value: number, config?: {
    type: "reset"
  } | {
    type: "smooth" | "smooth-edge"
    duration: number
  }, onFinish?: SetValue<boolean>): void
  momentum: MomentumCall
}) {
  let moveM: MoveCache | undefined = undefined
  function getMaxScroll() {
    return wrapperSize() - containerSize()
  }
  function getMargin() {

    const maxScroll = getMaxScroll()
    const upperMargin = upperScrollDiff
    const lowerMargin = maxScroll + lowerScrollDiff
    return {
      upperMargin,
      lowerMargin,
      maxScroll
    }
  }
  function resetLocation(newY: number, maxScrollY: number) {
    const toY = newY > upperScrollDiff
      ? upperScrollDiff
      : newY < maxScrollY + lowerScrollDiff
        ? maxScrollY + lowerScrollDiff
        : newY
    if (toY != newY) {
      changeTo(toY, {
        type: "reset"
      })
    }
  }
  function setMove(last: MoveCache, n: number) {
    let diff = n - last.latestValue
    const cv = getCurrentValue()
    if (diff) {
      const { lowerMargin, upperMargin } = getMargin()
      if (!(cv < upperMargin && cv > lowerMargin)) {
        diff = diff / edgeSlow
      }
      const newValue = cv + diff
      changeTo(newValue)
      last.latestValue = n
      return newValue
    } else {
      return cv
    }
  }
  return {
    start(n: number, beginTime = performance.now()) {
      moveM = {
        beginValue: n,
        //不必精确时间,只是用于计算动量
        beginTime,
        latestValue: n
      }
    },
    move(n: number) {
      if (moveM) {
        setMove(moveM, n)
      }
    },
    end(n?: number, velocity?: number) {
      const last = moveM
      if (last) {
        if (typeof n != 'number') {
          n = last.latestValue
        }
        const newY = setMove(last, n)
        moveM = undefined
        const { lowerMargin, upperMargin, maxScroll } = getMargin()
        if (newY < upperMargin && newY > lowerMargin) {
          if (typeof velocity != 'number') {
            velocity = (n - last.beginValue) / (performance.now() - last.beginTime) //默认使用平均速度,因为最后的瞬间速度可能为0?
          }
          const { destination, duration } = momentum(
            newY,
            velocity,
            wrapperSize(),
            lowerMargin,
            upperMargin
          )
          changeTo(
            destination,
            {
              type: destination < upperMargin && destination > lowerMargin
                ? 'smooth'
                : 'smooth-edge',
              duration
            },
            function (bool) {
              if (bool) {
                resetLocation(getCurrentValue(), getMaxScroll())
              }
            })
        } else {
          resetLocation(newY, maxScroll)
        }
      }
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
