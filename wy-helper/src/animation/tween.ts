import { Quote } from "../util";

type EaseFn = (n: number) => number
//N次方:自定义
function poly(n: number) {
  return function (t: number) {
    return Math.pow(t, n)
  }
}

export type EaseType = 'in' | 'out' | 'in-out'
/**
 * 将一个easeIn的函数,转化成easeOut
 * @param elapsedTime 
 * @param easeInFn 
 * @param distance 
 * @param duration 
 * @returns 
 */
export function easeOut(
  elapsedTime: number,
  easeInFn: Quote<number>,
  distance: number,
  duration: number
) {
  return distance - easeInFn(duration - elapsedTime)
}

/**
 * 将一个easeIn的函数转化成easeInOut
 * @param elapsedTime 
 * @param easeInFn 
 * @param distance 
 * @param duration 
 * @returns 
 */
export function easeInOut(
  elapsedTime: number,
  easeInFn: Quote<number>,
  distance: number,
  duration: number
) {
  if (elapsedTime < 0.5 * duration) {
    return easeInFn(elapsedTime * 2) / 2
  }
  return distance - easeInFn((duration - elapsedTime) * 2) / 2
}
/**
 * 参考reanimated https://github.dev/software-mansion/react-native-reanimated/tree/main/src
 * https://easings.net
 */
export const easeFns = {
  in(easing: EaseFn) {
    return easing
  },
  out(easing: EaseFn) {
    return function (t: number) {
      return 1 - easing(1 - t)
    }
  },
  inOut(easing: EaseFn) {
    return function (t: number) {
      if (t < 0.5) {
        return easing(t * 2) / 2
      }
      return 1 - easing((1 - t) * 2) / 2
    }
  },
  /**N次方 */
  poly,
  /**二次方 */
  quad: poly(2),
  /**三次方 */
  cubic: poly(3),
  /**四次方 */
  quart: poly(4),
  /**五次方 */
  quint: poly(5),
  /**
   * 正弦曲线的缓动
   * @param t 
   * @returns 
   */
  sine(t: number) {
    return 1 - Math.cos(t * Math.PI / 2);
  },
  /**
   * 指数曲线的缓动
   * cubic-bezier(0.7, 0, 0.84, 0)
   * @param t 
   * @returns 
   */
  expo(t: number) {
    return t == 0 ? 0 : Math.pow(2, 10 * (t - 1))
  },
  /**
   * 圆形曲线的缓动
   * cubic-bezier(0.55, 0, 1, 0.45)
   * @param t 
   * @returns 
   */
  circ(t: number) {
    return 1 - Math.sqrt(1 - t * t)
  },
  /**
   * 模拟弹性动画
   * 松紧带
   * 果冻效果，比back效果更强一些，会多抖动几次
   * 指数衰减的正弦曲线缓动
   * @param bounciness 弹性
   * @returns 
   */
  elasticOut(bounciness = 1) {
    const p = bounciness * Math.PI;
    return function (t: number) {
      return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p)
    }
  },
  /**
   * 
   * 
https://easings.net/#easeInElastic
const c4 = (2 * Math.PI) / 3;
return x === 0
  ? 0
  : x === 1
  ? 1
  : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);

   * 从https://github.com/zhangxinxu/Tween/blob/master/tween.js 简化
   * @param a 振幅
   * @param p 频率(越小周期越多)
   * @returns 
   */
  getElastic(
    a: number,
    p: number = 0.3) {
    return function (
      t: number) {
      var s: number;
      if (t == 0) return 0;
      if (t == 1) return 1;
      if (!a || a < Math.abs(1)) {
        s = p / 4;
        a = 1;
      } else {
        s = p / (2 * Math.PI) * Math.asin(1 / a);
      }
      return -(a * Math.pow(2, 10 * (t -= 1)) *
        Math.sin((t - s) * (2 * Math.PI) / p));
    }
  },
  /**
   * 指数衰减的反弹缓动。
   * 缓冲恢复，视觉冲击力会比缓慢公式好一点，但是全局用就有点唐突，个人觉得把back公式加在需要着重展示的动画里面比较好，比如获得道具，消除奖励等。
   * 参数 s 是控制 Back 曲线形状的一个参数，通常被称为 overshoot（过冲）参数。
   * 当使用 Back 缓动函数时，s 参数用于控制动画的过冲效果。过冲是指动画在到达最终值之前超出目标值的现象，类似于弹簧在受到外力后会超过平衡位置一段距离然后再回弹回来的现象。
   * 当 s 的值较大时，过冲效果会更加明显，动画会超出目标值一段距离后再回弹回来。当 s 的值较小时，过冲效果会减弱，动画的回弹效果会相对缓和一些。
   * 常用的 s 参数值是 1.70158，但你也可以根据需要调整这个值来获得不同的过冲效果。通常情况下，s 的值应该是一个正数。
   * @param s 
   * @returns 
   */
  back(s = 1.70158) {
    return function (t: number) {
      return t * t * ((s + 1) * t - s);
    }
  },
  /**
   * 弹跳动画
   * 模拟小球落地，最简单模拟东西落地的弹性效果，虽然也假了点，贵在简单易用。
   * 再用out包装一下,就能得到in
   * @param t 
   * @returns 
   */
  bounceOut(t: number) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    }

    if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    }

    if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    }

    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
}

const { sqrt, exp, sin, cos } = Math;
/**
 * 
 * https://github.com/pomber/use-spring  stiffness=170 mass=1 damping=26
 * @param param0 
 * @returns 
 */
export function springAnimationFn({
  dx, dt, v0,
  k, c, m
}: {
  /**初始位置到最终位置的差 */
  dx: number
  /**已经运动了多少时间,t-t0,秒,即如果是requestFrameAnimation,需要除以1000*/
  dt: number
  /**初始速度,一般是0 */
  v0: number
  /* Spring stiffness, in kg / s^2 刚度 170*/
  k: number;
  /**阻尼 damping 26*/
  c: number;
  /**质量 mass*/
  m: number;
}): Output {
  const radicand = c * c - 4 * k * m;
  if (radicand > 0) {
    const rp = (-c + sqrt(radicand)) / (2 * m);
    const rn = (-c - sqrt(radicand)) / (2 * m);
    const a = (dx * rp - v0) / (rp - rn);
    const b = (v0 - dx * rn) / (rp - rn);
    return {
      x: a * exp(rn * dt) + b * exp(rp * dt),
      v: a * rn * exp(rn * dt) + b * rp * exp(rp * dt)
    };
  } else if (radicand < 0) {
    const r = -c / (2 * m);
    const s = sqrt(-radicand) / (2 * m);
    const a = dx;
    const b = (v0 - r * dx) / s;
    return {
      x: exp(r * dt) * (a * cos(s * dt) + b * sin(s * dt)),
      v:
        exp(r * dt) *
        ((b * s + a * r) * cos(s * dt) - (a * s - b * r) * sin(s * dt))
    };
  } else {
    const r = -c / (2 * m);
    const a = dx;
    const b = v0 - r * dx;
    return {
      x: (a + b * dt) * exp(r * dt),
      v: (b + a * r + b * r * dt) * exp(r * dt)
    };
  }
}
type Output = {
  /**位移量 */
  x: number;
  /**当前速度 */
  v: number;
};