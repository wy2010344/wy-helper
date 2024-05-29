import { AnimationConfig, DampingAnimationConfig, DampingEdgeAnimationConfig, SpringBaseAnimationConfig, SpringOutValue, getMaxDistance, getTimeToVelocity, springBase, springIsStop } from "./animation"
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
  (arg: MomentumEndArg): MomentumCallOut
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
  wrapperSize: number,
}

export type MomentumCallOut = [number, AnimationConfig]

export interface MomentumCallIdeal {
  (velocity: number): {
    distance: number
    duration: number
  }
}

export type OldGetValue = {
  getOnDragEnd(duration: number, edge: boolean): AnimationConfig
  onEdgeBack: AnimationConfig
}
export class MomentumIScroll {
  private constructor(
    public readonly deceleration = 0.0006
  ) {
    this.deceleration = Math.abs(deceleration)
  }

  idealFn(t: number, dir: -1 | 1, absSpeed: number) {
    //(初速度+末速度)*t/2
    return dir * t * (absSpeed + (absSpeed - this.deceleration * t)) / 2
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

    const dir = velocity < 0 ? -1 : 1
    //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
    const distance = duration * (absSpeed / 2) * dir;

    return {
      dir,
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
   * 有边界的情况,受边界弹性的影响
   * @param current 
   * @param velocity 
   * @param wrapperSize 
   * @param lowerMargin 
   * @param upperMargin 
   * @returns 
   */
  getDestinationWithMargin(
    {
      current, velocity,
      lowerMargin, upperMargin, wrapperSize
    }: MomentumEndArg,
    get: OldGetValue
  ): MomentumCallOut {
    if (lowerMargin < current && current < upperMargin) {
      //在边界内部
      let { absSpeed, duration, distance } = this.getWithSpeedIdeal(velocity)
      //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
      let destination = current + distance
      let edge = false
      let finalPosition = 0
      //超出边界的时间,减少位移
      if (destination < lowerMargin) {
        destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (absSpeed / 8)) : lowerMargin;
        let distance = Math.abs(destination - current);
        duration = distance / absSpeed;
        edge = true
        finalPosition = lowerMargin
      } else if (destination > upperMargin) {
        destination = wrapperSize ? wrapperSize / 2.5 * (absSpeed / 8) : upperMargin;
        let distance = Math.abs(current) + destination;
        duration = distance / absSpeed;
        edge = true
        finalPosition = upperMargin
      }
      if (edge) {
        const before = get.getOnDragEnd(duration, true)
        return [
          finalPosition,
          {
            initFinished(from, target) {
              return before.initFinished(from, target)
            },
            computed(diffTime, from, target) {
              const dx = diffTime - duration
              if (dx > 0) {
                return get.onEdgeBack.computed(dx, destination, target)
              }
              return before.computed(diffTime, from, destination)
            },
            finished(diffTime, out) {
              const dx = diffTime - duration
              if (dx > 0) {
                return get.onEdgeBack.finished(dx, out)
              }
              return false
            },
          }]
      }
      return [destination, get.getOnDragEnd(duration, false)]
    } else {
      //在边界外面
      return [getDestination(current, lowerMargin, upperMargin), get.onEdgeBack]
    }
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


export function getGammaFrom(
  /** 阻尼系数 d */
  damping: number,
  /** 质量 m */
  mass: number,
) {
  return mass / damping
}


function getDestination(value: number, lowerMargin: number, upperMargin: number) {
  if (value <= lowerMargin) {
    return lowerMargin
  }
  if (upperMargin <= value) {
    return upperMargin
  }
  return value
}

export class MomentumDamping {
  constructor(
    /**
     * 质量/阻尼系数
     */
    public readonly gamma: number
  ) { }
  getVelocity(
    /**初始速度 */
    initialVelocity: number,
    /**时间 */
    elapsedTime: number
  ) {
    return -initialVelocity * Math.exp(-this.gamma * elapsedTime)
  }
  /**
   * 获得到达指定距离的时间,即滚动到达边界
   * @param initialVelocity 
   * @param distance 
   * @returns 
   */
  private getTimeToDistance(
    maxDistance: number,
    distance: number) {
    return Math.log(Math.abs(1 - distance / maxDistance)) / this.gamma
  }

  getDestinationIdeal(
    velocity: number,
    velocityThreshold = 2
  ): AnimationConfig {
    velocity = velocity * 1000
    return new DampingAnimationConfig(this.gamma, velocity, velocityThreshold)
  }
  getDestinationWithMargin(
    {
      current, velocity,
      lowerMargin, upperMargin
    }: MomentumEndArg,
    zta = 1,
    omega0 = 8,
    displacementThreshold = 0.01,
    velocityThreshold = 2
  ): MomentumCallOut {
    const that = this
    velocity = velocity * 1000
    if (lowerMargin < current && current < upperMargin) {
      //在容器内
      /**
       * (t: number) => SpringOutValue
       * 这里其实分两个阶段,
       * 阶段1,走到edge
       * 阶段2,走出edge,使用弹簧动画
       *  但这个弹簧动画,阻尼是知道的,质量也可能确定了,弹性系数不知道,deltaX是0
       */
      const distance = getMaxDistance(this.gamma, velocity)
      const destination = current + distance
      if (destination < lowerMargin || destination > upperMargin) {
        const edge = getDestination(destination, lowerMargin, upperMargin)
        const nt = this.getTimeToDistance(distance, edge)
        const initialVelocity = that.getVelocity(velocity, nt)
        return [
          edge,
          new DampingEdgeAnimationConfig(
            this.gamma,
            zta,
            omega0,
            velocity,
            initialVelocity,
            velocityThreshold,
            displacementThreshold,
            nt
          )]
      } else {
        return [
          destination,
          new DampingAnimationConfig(this.gamma, velocity, velocityThreshold)
        ]
      }
    } else {
      //从边缘恢复
      const destination = getDestination(current, lowerMargin, upperMargin)
      return [
        destination,
        new SpringBaseAnimationConfig({
          zta, omega0,
          initialVelocity: velocity,
          displacementThreshold,
          velocityThreshold
        })
        //   {
        //   initFinished(from, target) {
        //     return false
        //   },
        //   computed(diffTime) {
        //     const t = diffTime / 1000
        //     return springBase({
        //       zta,
        //       omega0,
        //       deltaX: destination - current,
        //       initialVelocity: velocity,
        //       elapsedTime: t
        //     })
        //   },
        //   finished(diffTime, out) {
        //     if (out) {
        //       return springIsStop(out, displacementThreshold, velocityThreshold)
        //     }
        //     return false
        //   },
        // }
      ]
    }
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
    const absSpeed = Math.abs(velocity)
    const duration = Math.min(this.swipeTime, (absSpeed * 2) / this.deceleration)
    const dir = velocity < 0 ? -1 : 1
    return {
      dir,
      absSpeed,
      distance: ((velocity * velocity) / this.deceleration) * dir,
      duration
    }
  }

  getDestinationWithMargin(
    {
      current, velocity,
      lowerMargin, upperMargin, wrapperSize
    }: MomentumEndArg,
    get: OldGetValue
  ): MomentumCallOut {
    if (lowerMargin < current && current < upperMargin) {
      let { distance, duration } = this.getWithSpeedIdeal(velocity)
      let destination = current + distance
      let rate = 15
      let edge = false

      let finalPosition = 0

      if (destination < lowerMargin) {
        destination = wrapperSize
          ? Math.max(
            lowerMargin - wrapperSize / 4,
            lowerMargin - (wrapperSize / rate) * velocity
          )
          : lowerMargin
        duration = this.swipeBounceTime
        edge = true
        finalPosition = lowerMargin
      } else if (destination > upperMargin) {
        destination = wrapperSize
          ? Math.min(
            upperMargin + wrapperSize / 4,
            upperMargin + (wrapperSize / rate) * velocity
          )
          : upperMargin
        duration = this.swipeBounceTime
        edge = true
        finalPosition = upperMargin
      }
      if (edge) {
        const before = get.getOnDragEnd(duration, true)
        return [
          finalPosition,
          {
            initFinished(from, target) {
              return before.initFinished(from, target)
            },
            computed(diffTime, from, target) {
              const dx = diffTime - duration
              if (dx > 0) {
                return get.onEdgeBack.computed(dx, destination, target)
              }
              return before.computed(diffTime, from, destination)
            },
            finished(diffTime, out) {
              const dx = diffTime - duration
              if (dx > 0) {
                return get.onEdgeBack.finished(dx, out)
              }
              return false
            },
          }]
      }
      return [destination, get.getOnDragEnd(duration, false)]
    } else {
      return [getDestination(current, lowerMargin, upperMargin), get.onEdgeBack]
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
  dampingIdeal({
    gamma,
    velocityThreshold = 2
  }: {
    gamma: number
    velocityThreshold?: number
  }): MomentumCallIdeal {
    return function (speed) {
      return {
        distance: getMaxDistance(gamma, speed),
        duration: getTimeToVelocity(gamma, speed, velocityThreshold)
      }
    }
  },
  dammping({
    gamma,
    zta = 1,
    omega0 = 8,
    displacementThreshold = 0.01,
    velocityThreshold = 2
  }: {
    gamma: number
    zta?: number
    omega0?: number
    displacementThreshold?: number
    velocityThreshold?: number
  }): MomentumCall {
    const m = new MomentumDamping(gamma)
    return function (v) {
      return m.getDestinationWithMargin(
        v,
        zta,
        omega0,
        displacementThreshold,
        velocityThreshold)
    }
  },
  iScroll(get: OldGetValue, arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number
  } = emptyObject): MomentumCall {
    const iScroll = MomentumIScroll
      .get(arg.deceleration)
    return function (v) {
      return iScroll.getDestinationWithMargin(v,
        get
      )
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
    get: OldGetValue,
    arg: {
      //表示 momentum 动画的减速度。
      deceleration?: number,
      //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
      swipeBounceTime?: number
      //设置 momentum 动画的动画时长。
      swipeTime?: number,
    } = emptyObject
  ): MomentumCall {
    const iScroll = MomentumBScoll
      .get(arg)
    return function (v) {
      return iScroll.getDestinationWithMargin(v, get)
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




/**
 * 这里是滚动受传统摩擦阻力的情况,摩擦阻力F=ma 这个是固定不变的
 * 但滚动也可能受阻尼力,阻尼力F=-cV 这个与速度有关,产生减速度又作用于质量而产生加速度
 *  如果滚动到边界外,当然受边界吸引回来,这个阻尼系数是不变的,只有弹性系数
 * @param param0 
 * @returns 
 */
export function buildNoEdgeScroll({
  momentum,
  changeDiff
}: {
  momentum: MomentumCallIdeal
  changeDiff(
    diff: number,
    duration?: number
  ): void
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
  finish
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
  changeTo(value: number): void
  finish(v: MomentumEndArg): void
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
        const { lowerMargin, upperMargin } = getMargin()

        if (typeof velocity != 'number') {
          velocity = (n - last.beginValue) / (performance.now() - last.beginTime) //默认使用平均速度,因为最后的瞬间速度可能为0?
        }

        finish({
          current: newY,
          velocity,
          lowerMargin,
          upperMargin,
          wrapperSize: wrapperSize()
        })
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