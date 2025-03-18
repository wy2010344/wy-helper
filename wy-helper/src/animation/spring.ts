import { emptyObject } from "../util"

export type SpringBaseArg = {
  /**自由振荡角频率,默认8 */
  omega0?: number
  /**阻尼比:0~1~无穷,0~1是欠阻尼,即会来回,1~无穷不会来回*/
  zta?: number
}
export function springBase(
  /**已使用时间 */
  elapsedTime: number,
  /**起始位置 */
  deltaX: number,
  /**初始速度 v0 (可选) */
  initialVelocity: number,
  {
    /**默认1 */
    zta = 1,
    /**默认8 */
    omega0 = 20
  }: SpringBaseArg = emptyObject,
  //在zta大于1时计算速度
  velocityWhenZta1Plus?: boolean) {

  //时间要从毫秒转化成秒
  elapsedTime = elapsedTime / 1000
  //设想的正向是下落,与位移一致,且要乘以时间ms
  initialVelocity = -initialVelocity * 1000
  // value = to - displacement
  if (zta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zta * zta)
    const cosCoeff = deltaX
    // Underdamped
    const sinCoeff = (initialVelocity + (zta * omega0 * deltaX)) / omegaD
    const cos1 = Math.cos(omegaD * elapsedTime)
    const sin1 = Math.sin(omegaD * elapsedTime)

    const underDampedEnvelope = Math.exp(-zta * omega0 * elapsedTime)

    const displacement = underDampedEnvelope * (cosCoeff * cos1 + sinCoeff * sin1)
    return {
      //FM,Gpt,Jc,ReA
      displacement,
      //Jc,Rea依赖上一步,没有对上,Gpt,FM没有提供
      velocity: displacement * (-omega0) * zta
        + underDampedEnvelope * omegaD * (sinCoeff * cos1 - cosCoeff * sin1)
    }

  } else if (zta == 1) {
    // Critically damped,
    const coeffA = deltaX
    const coeffB = initialVelocity + omega0 * deltaX
    const criticallyDampedEnvelope = Math.exp(-omega0 * elapsedTime)
    return {
      //==FM,Gpt,Jc,ReA
      displacement: (coeffA + coeffB * elapsedTime) * criticallyDampedEnvelope,
      //Jc,Rea没有对止,Gpt,FM没有提供
      velocity: velocityWhenZta1Plus
        ? criticallyDampedEnvelope * (
          (coeffA + coeffB * elapsedTime) * (-omega0) + coeffB
        ) : 0
    }

  } else {
    const cext = omega0 * Math.sqrt(zta * zta - 1)
    const gammaPlus = (-zta * omega0 + cext)
    const gammaMinus = (-zta * omega0 - cext)
    // Overdamped
    const coeffA = deltaX - (gammaMinus * deltaX - initialVelocity) / (gammaMinus - gammaPlus)
    const coeffB = (gammaMinus * deltaX - initialVelocity) / (gammaMinus - gammaPlus)
    return {
      //Jc
      displacement: coeffA * Math.exp(gammaMinus * elapsedTime) +
        coeffB * Math.exp(gammaPlus * elapsedTime),
      //Jc
      velocity: velocityWhenZta1Plus
        ? coeffA * gammaMinus * Math.exp(gammaMinus * elapsedTime) + coeffB * gammaPlus * Math.exp(gammaPlus * elapsedTime)
        : 0
    }
  }
}

/**
 * 阻尼力使用与速度成正比,并非客观物理规律,只是摩擦力分静态摩擦力与动态摩擦力,而不是与速度相关,方便计算
 * @param stiffness 
 * @param damping 
 * @param mass 
 * @returns 
 */
export function getZtaAndOmega0From(
  /**弹性系数 k */
  stiffness: number,
  /** 阻尼系数 d */
  damping: number,
  /** 质量 m */
  mass: number
) {
  return {
    /**自由振荡角频率 */
    omega0: Math.sqrt(stiffness / mass),
    /**阻尼比 */
    zta: damping / (2 * Math.sqrt(stiffness * mass))
  }
}

export type SpringOutValue = {
  displacement: number
  velocity: number
}
/**
 * 按理说应该用能量剩余来计算
 * JC使用了较复杂的牛顿法去预估时间.
 * 其实只有欠阻尼需要评估速度
 * 
 * 
 * @param n 
 * @param displacementThreshold FM中是0.5,RNA中是0.01
 * @param velocityThreshold FM中是10,RNA中是2
 * 使用FM更科学,displayment最终使用的是像素,在0.5时几乎无法察觉
 */
export function springIsStop(n: SpringOutValue, displacementThreshold = 0.5, velocityThreshold = 10) {
  return Math.abs(n.displacement) < displacementThreshold && Math.abs(n.velocity) < velocityThreshold
}

/**
 * 如果能能量来计算
 * stiffness*displacement*displacement+mass*velocity*velocity
 * stiffness / mass=omega0*omega0
 * stiffness * mass = Math.pow(damping/zta/2,2)
 * 
 * stiffness=omega0*damping/zta/2
 * mass=damping/zta/2/omega0
 * 这里需要涉及一个damping
 * 但真应该用能量去计算吗?应该用真实的结束时间去计算.
 */
export function springIsStop2(
  n: SpringOutValue,
  damping: number,
  omega0: number,
  zta: number
) {
  const energy = (Math.pow(n.displacement, 2) * omega0 + Math.pow(n.velocity, 2) / omega0) * damping / zta / 2
}


