

/**
 * https://easings.net/#
 */
export const easeCssFn = {
  sine: {
    in: 'cubic-bezier(0.12, 0, 0.39, 0)',
    out: 'cubic-bezier(0.61, 1, 0.88, 1)',
    inOut: 'cubic-bezier(0.37, 0, 0.63, 1)'
  },
  quad: {
    in: 'cubic-bezier(0.11, 0, 0.5, 0)',
    out: 'cubic-bezier(0.5, 1, 0.89, 1)',
    inOut: 'cubic-bezier(0.45, 0, 0.55, 1)'
  },
  cubic: {
    in: 'cubic-bezier(0.32, 0, 0.67, 0)',
    out: 'cubic-bezier(0.33, 1, 0.68, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)'
  },
  quart: {
    in: 'cubic-bezier(0.5, 0, 0.75, 0)',
    out: 'cubic-bezier(0.25, 1, 0.5, 1)',
    inOut: 'cubic-bezier(0.76, 0, 0.24, 1)'
  },
  quint: {
    in: 'cubic-bezier(0.64, 0, 0.78, 0)',
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    inOut: 'cubic-bezier(0.83, 0, 0.17, 1)'
  },
  expo: {
    in: 'cubic-bezier(0.7, 0, 0.84, 0)',
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.87, 0, 0.13, 1)'
  },
  circ: {
    in: 'cubic-bezier(0.55, 0, 1, 0.45)',
    out: 'cubic-bezier(0, 0.55, 0.45, 1)',
    inOut: 'cubic-bezier(0.85, 0, 0.15, 1)'
  },
  back: {
    in: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    out: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    inOut: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
  }
}


/**
 * 
 * 不太靠谱!!
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
