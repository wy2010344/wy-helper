/**
 * 产生动画
 * @param xp 
 */
export function animationOf(xp: {
  /**持续时间 毫秒，1000毫秒是1秒*/
  duration: number
  /**开始的值 */
  min?: number
  /**结束的值 */
  max: number
  /**回调位移,与时间 */
  call?(num: number, t: number): void
  /**位移变化，与时间变化 */
  diff?(num: number, t: number): void
  /**使用的动画 */
  change: AnimationFun,
  /**结束时调用 */
  end?(): void
}) {
  let cancel = false
  const start = Date.now()
  const calls: ((num: number, t: number) => void)[] = []
  if (xp.call) {
    calls.push(xp.call)
  }
  if (xp.diff) {
    const diff = xp.diff
    let lastnum = 0
    let lastT = 0
    calls.push(function (num, t) {
      diff(num - lastnum, t - lastT)
      lastnum = num
      lastT = t
    })
  }
  function oneCall(num: number, t: number) {
    for (let call of calls) {
      call(num, t)
    }
  }
  function animate() {
    const t = Date.now() - start
    if (t > xp.duration) {
      //结束
      oneCall(xp.max, xp.duration)
      if (xp.end) {
        xp.end()
      }
    } else {
      const y = xp.change(t, xp.min || 0, xp.max, xp.duration)
      oneCall(y, t)
      if (!cancel) {
        requestAnimationFrame(animate)
      }
    }
  }
  animate()
  return function () {
    cancel = true
  }
}

interface AnimationPkg {
  easeIn: AnimationFun
  easeOut: AnimationFun
  easeInOut: AnimationFun
}
export interface AnimationFun {
  /**
   * @param t current time（当前经过了多少时间）
   * @param b beginning value（初始值）
   * @param c change value（目标值）
   * @param d duration（持续时间）
   * @returns 位移
   */
  (t: number, b: number, c: number, d: number, e?: number, f?: number): number
}
export const Animation = {
  Linear: <AnimationFun>function (t, b, c, d) { return c * t / d + b; },
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
  Elastic: <AnimationPkg>{
    easeIn(t, b, c, d, a, p) {
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
    },
    easeOut(t, b, c, d, a, p) {
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
    },
    easeInOut(t, b, c, d, a, p) {
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
  },
  Back: <AnimationPkg>{
    easeIn(t, b, c, d, s) {
      if (typeof s == "undefined") s = 1.70158;
      return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOut(t, b, c, d, s) {
      if (typeof s == "undefined") s = 1.70158;
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOut(t, b, c, d, s) {
      if (typeof s == "undefined") s = 1.70158;
      if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
      return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    }
  },
  Bounce: <AnimationPkg>function () {
    const easeOut: AnimationFun = function (t, b, c, d) {
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
    const easeIn: AnimationFun = function easeIn(t, b, c, d) {
      return c - Animation.Bounce.easeOut(d - t, 0, c, d) + b;
    }
    const easeInOut: AnimationFun = function (t, b, c, d) {
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
  }()
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
export function drawOfBezier3(p: DrawOfBezier3): AnimationFun {
  return function bezierFun(t, b, c, d) {
    t = t / d;
    var y = p.start * Math.pow(1 - t, 3) +
      3 * p.c1 * t * Math.pow(1 - t, 2) +
      3 * p.c2 * Math.pow(t, 2) * (1 - t) +
      p.end * Math.pow(t, 3);
    return b + (300 - y) / 200 * c;
  }
}


/**
 * https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/
 * 
 * 刚度、摩擦系数越大,越快停止
 * 
 * 这个计算是粗糙的,主要是1,有时间间隔,而且时间间隔不均匀.而摩擦力与位移呈现出相关性
 * @param param0 
 * @returns 
 */
export function springAnimationOf({
  stiffness,
  mass,
  damping,
  min = 0,
  minEnergy = 1,
  max,
  update,
  finish
}: {
  /**刚度 */
  stiffness: number
  /**质量 */
  mass: number
  /**阻尼*/
  damping: number
  /**最小能量*/
  minEnergy?: number
  /**开始的值 */
  min?: number
  /**结束的值 */
  max: number
  /**更新 */
  update(x: number, v: number, t: number): void
  finish?(): void
}) {
  /* Object position and velocity. */
  let x = max - min;
  let v = 0;
  /* Spring stiffness, in kg / s^2 */
  let k = -stiffness;
  /* Damping constant, in kg / s */
  let d = -damping;
  /* Framerate: we want 60 fps hence the framerate here is at 1/60 */
  const date = Date.now()
  let lastDate = date
  function animate() {
    let newDate = Date.now()
    const frameRate = (newDate - lastDate) / 1000
    lastDate = newDate
    //力=负刚度*位移
    let Fspring = k * x;
    let Fdamping = d * v;

    const F = Fspring + Fdamping

    let a = F / mass;
    //速度=旧速度+加速度*时间间隔
    v += a * frameRate;
    //位置=旧位置+速度*时间
    x += v * frameRate;
    update(x + min, v, newDate - date)
    //能量
    const energy = 0.5 * mass * v * v + Math.abs(x * F)
    if (energy < minEnergy) {
      finish?.()
    } else {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

const { sqrt, exp, sin, cos } = Math;
/**
 * 
 * https://github.com/pomber/use-spring  stiffness=170 mass=1 damping=26
 * @param param0 
 * @returns 
 */
export function spring({
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