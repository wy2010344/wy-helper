/**
 * 重力下,位移与速度的关系
 * s=vt+1/2 g t*t
 * 速度逐渐加快,是一个ease-in函数
 */

import { easeInOut, easeOut, EaseType } from './tween';

/**
 * 也想与摩擦力统一
 */
export class WeightMeasure {
  /**
   * +1 与降落方向一致
   * -1 向天空抛
   */
  public readonly dir: -1 | 1;
  public readonly duration: number;
  public readonly acceleration: number;
  constructor(
    public readonly height: number,
    /**初速度 */
    public readonly initVelocity = 0,
    /**加速度 */
    acceleration = 0.0006
  ) {
    const absAcceleration = Math.abs(acceleration);
    if (height < 0) {
      acceleration = -absAcceleration;
    } else {
      acceleration = absAcceleration;
    }
    this.acceleration = acceleration;

    this.dir = initVelocity * height < 0 ? -1 : 1;
    const sqrtPart = Math.sqrt(
      initVelocity * initVelocity + 2 * this.acceleration * this.height
    );

    let cinitVelocity = initVelocity;
    if (height < 0) {
      cinitVelocity = -initVelocity;
    }
    this.duration = (-cinitVelocity + sqrtPart) / absAcceleration;
  }

  getVelocity(
    /**时间 */
    elapsedTime: number
  ) {
    return this.initVelocity + this.acceleration * elapsedTime;
  }

  getDistance = (elapsedTime: number) => {
    return (
      this.initVelocity * elapsedTime +
      0.5 * this.acceleration * elapsedTime * elapsedTime
    );
  };
  getEasyInOutDistance = (elapsedTime: number) => {
    return easeInOut(elapsedTime, this.getDistance, this.height, this.duration);
  };
  getEasyOutDistance = (elapsedTime: number) => {
    return easeOut(elapsedTime, this.getDistance, this.height, this.duration);
  };
}
