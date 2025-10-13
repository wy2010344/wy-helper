/**
 * 大转盘
 */

import { createSignal } from '../signal';
import { StoreRef } from '../storeRef';
import { EmptyFun, emptyObject, Quote } from '../util';
import { ReadValueCenter, valueCenterOf } from '../ValueCenter';
import {
  SpringBaseAnimationConfigArg,
  springBaseAnimationConfigNoEnd,
} from './AnimationConfig';

function createBeginTime(config: Quote<number>, from = 0) {
  let startTime = 0;
  return function (time: number) {
    if (!startTime) {
      startTime = time;
    }
    const d = config(time - startTime);
    return d + from;
  };
}

export type EndConfig = (
  fromSpeed: number,
  fromValue: number,
  delta: number,
  fromTime: number
) => (time: number, diff: number, fromValue: number) => [number, boolean];
function createEndTime(createConfig: EndConfig) {
  let fn!: (time: number, diff: number, fromValue: number) => [number, boolean];
  return function (
    fromSpeed: number,
    targetDistance: number,
    beforeValue: number,
    time: number
  ): [number, boolean] {
    if (!fn) {
      const nextValue = fromSpeed + beforeValue;
      const diff = targetDistance - nextValue;
      fn = createConfig(fromSpeed, nextValue, diff, time);
      return [nextValue, false];
    }
    const diff = targetDistance - beforeValue;
    return fn(time, diff, beforeValue);
  };
}

/**
 * 创建一个大转盘
 * @param param0
 * @returns
 */
export function createBigSpin({
  beginConfig,
  endConfig,
  value,
  cycle,
  onFinish,
  timeout = 1000,
}: {
  /**开始时怎么迭代升级 */
  beginConfig: Quote<number>;
  endConfig: EndConfig;
  value: StoreRef<number>;
  cycle: number;
  onFinish(): void;
  timeout?: number;
}) {
  let distance = 0;
  const drawValue = createSignal(false);
  return {
    onDrawEffect() {
      const beginFn = createBeginTime(beginConfig);
      const endFn = createEndTime(endConfig);
      let latestSpeed = 0;
      return function (time: number, cancel: EmptyFun) {
        if (distance) {
          const [newValue, end] = endFn(
            latestSpeed,
            distance,
            value.get(),
            time
          );
          // const speed = newValue - value.get();
          // console.log("end", speed);
          value.set(newValue);
          if (end) {
            //停止转运
            value.set(distance);
            drawValue.set(false);
            cancel();
            //防止下次animationFrame进入
            distance = 0;
            setTimeout(onFinish, timeout);
            return;
          }
        } else {
          const speed = beginFn(time);
          latestSpeed = speed;
          // console.log("begin", speed);
          const changeRadian = value.get() + speed;
          value.set(changeRadian % cycle);
        }
      };
    },
    drawValue: drawValue.get,
    beginDraw() {
      if (drawValue.get()) {
        return;
      }
      drawValue.set(true);
      return true;
    },
    setDistance(n: number) {
      distance = n;
    },
  };
}

export function bigSpinDeviceToEnd(
  edgeValue: number,
  deviceValue = 30
): EndConfig {
  return function (fromSpeed) {
    return function (time, diff, beforeValue) {
      const changeRadian = diff / deviceValue;
      const speed = Math.min(changeRadian, fromSpeed);
      return [speed + beforeValue, diff < edgeValue];
    };
  };
}

/**
 * 效果始终不行!!
 * 中间会加速!!
 * @param config
 * @returns
 */
export function bigSpinSpringToEnd(
  edgeValue: number,
  config: Omit<SpringBaseAnimationConfigArg, 'initialVelocity'> = emptyObject
): EndConfig {
  return function (fromSpeed, fromValue, delta, fromTime) {
    const fn = springBaseAnimationConfigNoEnd(delta, {
      ...config,
      initialVelocity: -(fromSpeed * 1000) / 20,
    });
    return function (time) {
      const value = fn(time - fromTime);
      const diff = delta - value;
      return [value + fromValue, diff < edgeValue];
    };
  };
}

/**
 * 步进
 * 也可用springBaseAnimationConfigNoEnd
 * 或tweenAnimationConfigNoEnd
 * @param target
 * @param step
 * @param from
 * @returns
 */
export function bigSpinStepTo(target: number, step: number) {
  let begin = 0;
  return function (time: number) {
    if (begin > target) {
      return target;
    }
    begin = begin + step;
    return begin;
  };
}
