import { run } from "../util";

/**
 * Tween动画集合
 * 这里是chat-gpt生成的结果
 */
export const TweenFns = {
  //V
  Linear(t: number) {
    return t;
  },
  Quad: {
    //V
    easeIn(t: number) {
      return t * t;
    },
    //V
    easeOut(t: number) {
      //2t-t^t
      return 1 - (1 - t) * (1 - t);
    },
    easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
  },
  Cubic: {
    easeIn(t: number) {
      return t * t * t;
    },
    easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    },
    easeInOut(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  },
  Quart: {
    easeIn(t: number) {
      return t * t * t * t;
    },
    easeOut(t: number) {
      return 1 - Math.pow(1 - t, 4);
    },
    easeInOut(t: number) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
  },
  Quint: {
    easeIn(t: number) {
      return t * t * t * t * t;
    },
    easeOut(t: number) {
      return 1 - Math.pow(1 - t, 5);
    },
    easeInOut(t: number) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }
  },
  Sine: {
    easeIn(t: number) {
      return 1 - Math.cos(t * Math.PI / 2);
    },
    easeOut(t: number) {
      return Math.sin(t * Math.PI / 2);
    },
    easeInOut(t: number) {
      return (1 - Math.cos(Math.PI * t)) / 2;
    }
  },
  Expo: {
    easeIn(t: number) {
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    easeOut(t: number) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    easeInOut(t: number) {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
      return (2 - Math.pow(2, -20 * t + 10)) / 2;
    }
  },
  Circ: {
    easeIn(t: number) {
      return 1 - Math.sqrt(1 - t * t);
    },
    easeOut(t: number) {
      return Math.sqrt(1 - (t - 1) * (t - 1));
    },
    easeInOut(t: number) {
      return t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(-((2 * t - 3) * (2 * t - 1)) + 1) + 1) / 2;
    }
  },
  /**
   * 怎么没有两个周期???
   */
  Elastic: {
    easeIn(t: number) {
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.075) * (2 * Math.PI) / 0.3);
    },
    easeOut(t: number) {
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
    easeInOut(t: number) {
      return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -Math.pow(2, 20 * t - 10) * Math.sin((t - 0.1125) * (2 * Math.PI) / 0.45) / 2 : Math.pow(2, -20 * t + 10) * Math.sin((t - 0.1125) * (2 * Math.PI) / 0.45) / 2 + 1;
    }
  },
  Back: {
    easeIn(t: number) {
      return 2.70158 * t * t * t - 1.70158 * t * t;
    },
    easeOut(t: number) {
      return 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
    },
    easeInOut(t: number) {
      return t < 0.5 ? 8 * t * t * t * t - 2 * t * t : 1 + 2 * Math.pow(2 * t - 2, 3) + 2 * Math.pow(2 * t - 2, 2);
    }
  },
  Bounce: {
    easeIn(t: number) {
      return 1 - TweenFns.Bounce.easeOut(1 - t);
    },
    easeOut(t: number) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    },
    easeInOut(t: number) {
      return t < 0.5 ? TweenFns.Bounce.easeIn(t * 2) / 2 : TweenFns.Bounce.easeOut(t * 2 - 1) / 2 + 0.5;
    }
  }
};





interface AnimationPkg {
  easeIn: AnimationFunZXX
  easeOut: AnimationFunZXX
  easeInOut: AnimationFunZXX
}
export interface AnimationFunZXX {
  /**
   * @param t current time（当前经过了多少时间）
   * @param b beginning value（初始值）
   * @param c change value（变化量）目标值是b+c
   * @param d duration（持续时间）
   * @returns 位移
   */
  (t: number, b: number, c: number, d: number): number
}
/**
 * https://www.zhangxinxu.com/wordpress/2016/12/how-use-tween-js-animation-easing/
 * https://github.com/zhangxinxu/Tween/blob/master/tween.js
 * https://blog.csdn.net/S_clifftop/article/details/89490422
 */
export const TweenFnZXX = {
  /**
   * 匀速 linear 用于匀速运动，开始和结束都比较突然，适用于游戏中卷轴类匀速运动，颜色，透明度过渡等。
   */
  Linear: <AnimationFunZXX>function (t, b, c, d) { return c * t / d + b; },
  /**
   * 二次方的缓动(t^2)
   * 
   */
  Quad: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return c * (t /= d) * t + b;
    },
    easeOut(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    },
    easeInOut(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t + b;
      return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
  },
  /**
   * 三次方的缓动(t^3)
   * cubic等缓慢公式，用于慢慢展现或者慢慢靠近结束，大部分物体运动都可以用这种效果来做
   */
  Cubic: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return c * (t /= d) * t * t + b;
    },
    easeOut(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOut(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
  },
  /**
   * 四次方的缓动(t^4)
   */
  Quart: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return c * (t /= d) * t * t * t + b;
    },
    easeOut(t, b, c, d) {
      return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOut(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
  },
  /**
   * 五次方的缓动(t^5)
   */
  Quint: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
    },
    easeOut(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOut(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
  },
  /**
   * 正弦曲线的缓动(sin(t))
   */
  Sine: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOut(t, b, c, d) {
      return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOut(t, b, c, d) {
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
  },
  /**
   * 指数曲线的缓动(2^t)
   */
  Expo: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOut(t, b, c, d) {
      return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },
    easeInOut(t, b, c, d) {
      if (t == 0) return b;
      if (t == d) return b + c;
      if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
  },
  /**
   * 圆形曲线的缓动（sqrt(1-t^2)）
   */
  Circ: <AnimationPkg>{
    easeIn(t, b, c, d) {
      return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOut(t, b, c, d) {
      return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOut(t, b, c, d) {
      if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
  },
  /***
   * 超过范围的三次方缓动（(s+1)*t^3 – s*t^2）
   * 指数衰减的正弦曲线缓动
   * 松紧带
   * 果冻效果，比back效果更强一些，会多抖动几次
   */
  Elastic: {
    /**
     * 
     * @param a 振幅 amplitude
     * @param p 周期 period
     * @returns 
     */
    getEaseIn(a: number, p?: number): AnimationFunZXX {
      return function (t, b, c, d) {
        var s;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (typeof p == "undefined") p = d * .3;
        if (!a || a < Math.abs(c)) {
          s = p / 4;
          a = c;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      }
    },
    getEaseOut(a: number, p?: number): AnimationFunZXX {
      return function (t, b, c, d) {
        var s;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (typeof p == "undefined") p = d * .3;
        if (!a || a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
      }
    },
    easeInOut(a: number, p?: number): AnimationFunZXX {
      return function (t, b, c, d) {
        var s;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (typeof p == "undefined") p = d * (.3 * 1.5);
        if (!a || a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
      }
    }
  },
  Back: {
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
    getEaseIn(s = 1.70158): AnimationFunZXX {
      return function (t, b, c, d) {
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
      }
    },
    getEaseOut(s = 1.70158): AnimationFunZXX {
      return function (t, b, c, d) {
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
      }
    },
    getEaseInOut(s = 1.70158): AnimationFunZXX {
      return function (t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
      }
    }
  },
  /**
   * 模拟小球落地，最简单模拟东西落地的弹性效果，虽然也假了点，贵在简单易用。
   */
  Bounce: <AnimationPkg>run(() => {
    const easeOut: AnimationFunZXX = function (t, b, c, d) {
      if ((t /= d) < (1 / 2.75)) {
        return c * (7.5625 * t * t) + b;
      } else if (t < (2 / 2.75)) {
        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
      } else if (t < (2.5 / 2.75)) {
        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
      } else {
        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
      }
    }
    const easeIn: AnimationFunZXX = function easeIn(t, b, c, d) {
      return c - easeOut(d - t, 0, c, d) + b;
    }
    const easeInOut: AnimationFunZXX = function (t, b, c, d) {
      if (t < d / 2) {
        return easeIn(t * 2, 0, c, d) * .5 + b;
      } else {
        return easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
      }
    }
    return {
      easeIn,
      easeInOut,
      easeOut,
    }
  })
}



export interface DrawOfBezier3 {
  start: number
  c1: number
  end: number
  c2: number
}
/***
 * 3阶贝塞尔，X方向与Y方向的计算是一样的。
 * @param startY 开始点Y
 * @param c1Y 开始点的控制点1
 * @param endY 结束点Y
 * @param c2Y 结束点的控制点2
 * @returns 动画函数
 */
export function drawOfBezier3(p: DrawOfBezier3): AnimationFunZXX {
  return function bezierFun(t, b, c, d) {
    t = t / d;
    var y = p.start * Math.pow(1 - t, 3) +
      3 * p.c1 * t * Math.pow(1 - t, 2) +
      3 * p.c2 * Math.pow(t, 2) * (1 - t) +
      p.end * Math.pow(t, 3);
    return b + (300 - y) / 200 * c;
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