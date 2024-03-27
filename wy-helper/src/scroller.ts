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
    /** < 0 初始位移 */
    start: number,
    /** 移动用时 */
    time: number,
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

export const momentum = {
  iScrollWithMargin({
    deceleration = 0.0006
  }: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
  } = emptyObject) {
    deceleration = Math.abs(deceleration)
    return function (speed: number) {
      const absSpeed = Math.abs(speed)
      //速度除以减速度,得变成0的时间
      let duration = absSpeed / deceleration;
      //时间*((初速度+0)/2)=位移,即均匀减速运动,需要使用二次方quadratic,easeOut
      let distance = duration * (absSpeed / 2) * (speed < 0 ? -1 : 1);

      return {
        absSpeed,
        distance,
        duration
      }
    }
  },
  iScroll(arg: {
    //表示 momentum 动画的减速度。
    deceleration?: number,
  } = emptyObject): MomentumCall {
    /**
     * @param speed 速度
     * @returns  位移 + 时间
     */
    const withoutMargin = momentum.iScrollWithMargin(arg)
    function withSpeed(
      current: number,
      /**速度,可能为负数*/
      speed: number,
      wrapperSize: number,
      lowerMargin: number,
      upperMargin: number
    ) {
      let { absSpeed, duration, distance } = withoutMargin(speed)
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
    return function (
      current,
      start,
      time,
      wrapperSize,
      lowerMargin,
      upperMargin
    ) {
      return withSpeed(current, (current - start) / time, wrapperSize, lowerMargin, upperMargin)
    }
  },
  bScroll(
    {
      deceleration = 0.0015,
      swipeBounceTime = 500,
      swipeTime = 2500
    }: {
      //表示 momentum 动画的减速度。
      deceleration?: number,
      //设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
      swipeBounceTime?: number
      //设置 momentum 动画的动画时长。
      swipeTime?: number
    } = emptyObject
  ): MomentumCall {
    return function (
      current,
      start,
      time,
      wrapperSize,
      lowerMargin,
      upperMargin
    ) {
      const distance = current - start
      const speed = Math.abs(distance) / time
      const duration = Math.min(swipeTime, (speed * 2) / deceleration)
      const momentumData = {
        destination:
          current + ((speed * speed) / deceleration) * (distance < 0 ? -1 : 1),
        duration,
        rate: 15
      }

      if (momentumData.destination < lowerMargin) {
        momentumData.destination = wrapperSize
          ? Math.max(
            lowerMargin - wrapperSize / 4,
            lowerMargin - (wrapperSize / momentumData.rate) * speed
          )
          : lowerMargin
        momentumData.duration = swipeBounceTime
      } else if (momentumData.destination > upperMargin) {
        momentumData.destination = wrapperSize
          ? Math.min(
            upperMargin + wrapperSize / 4,
            upperMargin + (wrapperSize / momentumData.rate) * speed
          )
          : upperMargin
        momentumData.duration = swipeBounceTime
      }
      momentumData.destination = Math.round(momentumData.destination)

      return momentumData
    }
  }
}



export function buildNoEdgeScroll({
  getCurrentValue,
  momentum,
  changeTo
}: {
  getCurrentValue(): number
  momentum(speed: number): {
    distance: number
    duration: number
  }
  changeTo(
    value: number,
    duration?: number): void
}) {
  let moveM: MoveCache | undefined = undefined

  function setMove(last: MoveCache, n: number) {
    let diff = n - last.latestValue
    const cv = getCurrentValue()
    if (diff) {
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
      const v = getCurrentValue()
      moveM = {
        beginValue: v,
        //不必精确时间,只是用于计算动量
        beginTime,
        value: v,
        latestValue: n
      }
      changeTo(v)
    },
    move(n: number) {
      if (moveM) {
        setMove(moveM, n)
      }
    },
    end(n: number) {
      const last = moveM
      if (last) {
        const newY = setMove(last, n)
        moveM = undefined
        const speed = (newY - last.beginValue) / (performance.now() - last.beginTime)
        const { distance, duration } = momentum(speed)
        changeTo(newY + distance, duration)
      }
    }
  }
}

type MoveCache = {
  value: number
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
      const v = getCurrentValue()
      moveM = {
        beginValue: v,
        //不必精确时间,只是用于计算动量
        beginTime,
        value: v,
        latestValue: n
      }
      changeTo(v)
    },
    move(n: number) {
      if (moveM) {
        setMove(moveM, n)
      }
    },
    end(n: number) {
      const last = moveM
      if (last) {
        const newY = setMove(last, n)
        moveM = undefined
        const { lowerMargin, upperMargin, maxScroll } = getMargin()
        if (newY < upperMargin && newY > lowerMargin) {
          const { destination, duration } = momentum(
            newY,
            last.beginValue,
            performance.now() - last.beginTime,
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


