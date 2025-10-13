import { getDestination, getMaxScroll } from '../scroller/util';
import { emptyObject, quote } from '../util';
import { createAnimationTime } from './animateSignal';
import { DeltaXSignalAnimationConfig } from './AnimationConfig';
import { AnimateSignal, AnimateSignalConfig } from './animateSignal';
import { easeInOut, easeOut, EaseType } from './tween';
import { SetValue } from '../setStateHelper';
import { ScrollHelper } from './destinationWithMargin';

/**
 * 摩擦,即是减速度,和weight相反
 * 待处理
 */
export class FrictionalFactory {
  private constructor(public readonly deceleration: number) {
    this.deceleration = Math.abs(deceleration);
    if (this.deceleration == 0) {
      throw new Error(`deceleration cann't be 0`);
    }
  }
  /**
   *
   * @param deceleration 减速度,默认0.0006 500px用时1.296s,一次滚动800 * 44,结束时不平滑..
   * @returns
   */
  static get(deceleration = 0.0006) {
    return new FrictionalFactory(deceleration);
  }

  getFromVelocity(initVelocity: number) {
    return new Frictional(this, initVelocity);
  }

  /**
   * elapsedTime=initVelocity/deceleration
   * initVelocity * elapsedTime - 0.5 * this.deceleration * elapsedTime * elapsedTime=distance
   * 或者 0.5*initVelocity*elapsedTime=distance
   *
   * v*v/a-0.5v*v/a=distance
   * 0.5*v*v/a=distance
   * 根据位移量生成,主要是卡片必须刚好滚动到相应位置需要调整初始速度
   * @param distance
   */
  getFromDistance(distance: number) {
    const dir = distance < 0 ? -1 : 1;
    const initVelocity =
      dir * Math.sqrt(distance * this.deceleration * dir * 2);
    return this.getFromVelocity(initVelocity);
  }
}

export class Frictional implements ScrollHelper {
  //初速度的绝对值
  public readonly absInitVelocity: number;
  public readonly deceleration: number;
  public readonly dir: -1 | 1;
  constructor(
    public readonly factory: FrictionalFactory,
    /**
     * 初速度
     */
    public readonly initVelocity: number
  ) {
    this.dir = initVelocity < 0 ? -1 : 1;
    this.absInitVelocity = this.dir * initVelocity;
    //减速度取与速度方向相反为正
    this.deceleration = factory.deceleration * this.dir;
    this.duration = this.initVelocity / this.deceleration;
    this.distance = (0.5 * initVelocity ** 2) / this.deceleration;
  }
  cloneFromDistance(distance: number): ScrollHelper {
    return this.factory.getFromDistance(distance);
  }
  //持续时间
  readonly duration: number;
  //最大位移量
  readonly distance: number;

  /**获得速度 */
  getVelocity(
    /**时间 */
    elapsedTime: number
  ) {
    return this.initVelocity - this.deceleration * elapsedTime;
  }
  /**
   * 位移:v0t-0.5at^2
   * 剩余量:
   *  0.5*initVelocity**2/deceleration //最大量
   * -initVelocity * elapsedTime - 0.5 * deceleration * elapsedTime * elapsedTime
   * @param elapsedTime
   * @returns
   */
  getDisplacement(
    /**时间 */
    elapsedTime: number
  ) {
    return this.distance - this.getDistance(elapsedTime);
  }

  /**
   * 位移
   * @param elapsedTime
   * @returns
   */
  getDistance = (elapsedTime: number) => {
    return (
      this.initVelocity * elapsedTime -
      0.5 * this.deceleration * elapsedTime * elapsedTime
    );
  };
  getEasyInOutDistance = (elapsedTime: number) => {
    return easeInOut(
      elapsedTime,
      this.getDistance,
      this.distance,
      this.duration
    );
  };
  getEasyOutDistance = (elapsedTime: number) => {
    return easeOut(elapsedTime, this.getDistance, this.distance, this.duration);
  };
  /**
   * 就是求一元二次方程的解
   * a= -0.5 * this.deceleration
   * b= this.initVelocity
   * c=-distance
   *
   *
   * -b+-sqrt(b*b-4ac)/2a
   *
   * -initVelocity+-sqrt(deceleration*deceleration-2*deceleration*distance)/-deceleration
   *
   * @param distance
   */
  getTimeToDistance(distance: number) {
    return (
      (this.initVelocity -
        this.dir *
          Math.sqrt(
            this.initVelocity * this.initVelocity -
              2 * this.deceleration * distance
          )) /
      this.deceleration
    );
  }

  /**
   * 到达指定速度的时间
   * @param velocity
   * @returns
   */
  getTimeToVelocity(velocity: number) {
    return (this.initVelocity - velocity) / this.deceleration;
  }

  animationConfig(duration = this.duration) {
    const it = this;
    return createAnimationTime(function (diffTime, setDisplacement) {
      if (diffTime < duration) {
        setDisplacement(it.getDistance(diffTime));
      } else {
        setDisplacement(it.getDistance(duration));
        return true;
      }
    });
  }
}
