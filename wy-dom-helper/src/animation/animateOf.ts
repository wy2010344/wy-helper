import { AnimationFunZXX } from 'wy-helper'
/**
 * 产生动画
 * 现实中是有个副作用值(类型可能是颜色)
 * 然后选择一种动画
 * 然后动画结束
 * @param xp 
 */
export function animationOf(xp: {
  /**持续时间 毫秒，1000毫秒是1秒*/
  duration: number
  /**开始的值 */
  from?: number
  /**结束的值 */
  target: number
  /**回调位移,与时间 */
  call?(num: number, t: number): void
  /**位移变化，与时间变化 */
  diff?(num: number, t: number): void
  /**使用的动画 */
  change: AnimationFunZXX,
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
      oneCall(xp.target, xp.duration)
      if (xp.end) {
        xp.end()
      }
    } else {
      const y = xp.change(t, xp.from || 0, xp.target, xp.duration)
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
