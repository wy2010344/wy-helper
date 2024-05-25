import { verify } from "crypto"




/**
 * 弹簧动画,一个关于能量的动画
 * 能量=动能+势能
 * 动能=0.5 * m * v * v
 * 势能=m * g * h
 *  或者说弹性力F = -k * x
 *  弹性力跟重力、电荷力还不一样....F=（Gm1m2）/r²
 *  弹性势能=0.5 * k * x * x
 * 阻力始终与速度相反
 * F = mu * H(m * g) 即一般考虑施加的力是重力
 * 在阻止下能量归于0,即停止动画
 * 
 * 需要得到一个关于时间与位移的公式
 *  速度是变化的
 * 要停下来,弹性力在某个时间要小于摩擦力
 * 但又要刚好在目标点停下来
 * 
 * 到达目标位置是必须的,所以不是考虑阻力,而是考虑能量如何随时间均匀减小到0
 * 这样知道指定时间的能量,但需要获得偏移与速度.
 * 
 * 这里有一点:存储了上一次的值、上一次的时间
 * 
 * 这是一个周期不变的运动,跟小球落地不同,小球落地是频率加快.bounce动画
 * 
 * 但需要一个与时间无关,只与初始速度与初始位移相关的动画曲线,即拖拽释放
 *  已经知道曲线的样子,只是从中取一段,如果曲线是周期的,取第一次到达该点后的地方作为开始,即时间要减去.现有的elastic动画,而它也不是
 *  这并不考虑速度,只考虑位移,即需要根据位移算时间,似乎是不能的
 * 
 * 使用微积分,进行瞬时力分析,由力得到加速度,由加速度改变速度,速度再累积成位移(不是特别平滑科学)
 * 
 * 
 * 能量均匀减少,周期不变,在给定的时间下,可以计算出相应的能量,
 * 又由周期性,可以计算出方向(给定几个周期)
 * 或者周期本身不固定,也变成均增或均减.
 * 
 * 
 * 从数学角度去构建曲线容易,但找不到物理量对应?无法进行逆运算,或者某种微积分来逆运算?
 * 
 * 
 * 不能使用重力体系,重力靠近0是不会消失,则还会做功
 * 阻力依固定摩擦力做功:
 *  F=u*m*g*h
 *  F=ma
 *  v=at
 *  E=0.5mv*v
 * 能量减少到0
 * 0.5*(Ft)*(Ft)/m=0.5 * k * x * x + 0.5 * m * v * v
 * 时间:
 * t=sqrt((k * x * x + m * v * v) * m)/F
 * 
 * 如果给定使用时间,可以算出F,与k,m的关系
 * 是整体周期守恒.t是剩余的需要运行的时间
 * 如果只给定k,m,F,可以算出时间
 * 现在t1运行到中间的的某个时间,则剩余时间是t-t1
 * 只是这时候x与v不知道,只是知道它们的关系,能量和是多少
 * 不考虑周期性,因为周期性的本质,是顶点速度为0,没有周期的时候,x与v,满足
 * 
 * 其实就是理想的弹簧力与位移
 * 在弹簧力与原始速度的加速下,运动了多远.
 * 
 * 在周期顶点,就是只有势力.
 * 想像一路减下来
 * x只与衰减能量有关,再叠加周期
 * 因此,初始能量减去阻力做功,就是剩余的弹性势能,得到弹性位移
 * 
 * energy=0.5 * k * x0 * x0 + 0.5 * m * v0 * v0 - 0.5*(Ft)*(Ft)/m
 * x=sqrt(energy / 0.5 / k)
 * 
 * 化简为
 * x = sqrt(x0 * x0 + m * v0 * v0 / k - (F*t)^2 / m * k)
 * 最终x要为0..就需要(F*t)^2 / m * k有终止的时间
 * 
 * 
 * 
 * 
 * 摩擦阻力不变,弹簧力却减少到0,相当于一个反向的力增加的运动
 *  物体的速度先增加再减少
 *  但是能量守恒..
 */
export function superEnergy({
  velocity = 0,
  distance,
  mass,
  stiffness,
  friction
}: {
  //初始速度
  velocity?: number
  //初始位移
  distance: number
  //质量
  mass: number
  //刚度,弹性系数
  stiffness: number
  //摩擦力
  friction: number
}) {
  const initE = stiffness * distance * distance + mass * velocity * velocity
  const costTime = Math.sqrt(initE * mass) / friction

  const temp1 = initE / stiffness
  const temp2 = Math.pow(friction, 2) / mass / stiffness
  return {
    time: costTime,
    fn(t: number) {
      /**
       *distance * distance + (mass * velocity * velocity / stiffness) - Math.pow(friction * t, 2) / mass / stiffness
       */
      const diff = temp1 - temp2 * t * t
      if (diff <= 0) {
        return 1
      }
      return 1 - Math.sqrt(diff)
    }
  }
}

/**
 * 使用stiffness作为基础吧,毕竟范围更大
 * @param stiffness 
 * @param time 
 * @returns 
 */
function getFractionWithStiffness(stiffness: number, time: number) {
  return Math.sqrt(stiffness) / time
}

function getStiffnessWithFraction(fraction: number, time: number) {
  return Math.pow(time * fraction, 2)
}
/**
 * 
 * 一般参考标准,distance=1
 * mass=1
 * velocity=0
 * 给定一个结束时间,标准曲线的结束时间是1
 * 
 * 配置必要的stiffness与friction,它们两有关系
 * 但改变参数stiffness曲线怎么不变?
 * 因为初始速度与位移不定,不能再用时间动画曲线去播放
 * 初始速度与位移,也与周期函数的调整有关..
 * 
 * 在理想情况下,知道速度与位移,计算所在时间
 * 
 * 初始能量-当前能量,除以消耗能量
 * 获得diffTime后,从diffTime开始播放
 * @param param0 
 */
export function energy({
  velocity = 0,
  distance = 1,
  stiffness
}: {
  //初始速度
  velocity?: number
  //初始位移
  distance?: number
  /**
   * 弹性系数
   */
  stiffness: number
}) {
  const friction = Math.sqrt(stiffness)

  //默认初始能量 stiffness
  //当下的初始能量 stiffness * distance * distance + velocity * velocity
  //需要比较当下那个能量更大,决定偏移时间
  //得到偏移时间,再开始动画,关键是简谐运动,也这会才开始吧
  //但如果简谐运动随时间变化,则最后不能正常归0
  //这里初始位移默认为1,则位移变化,要化为比例1.但速度是怎样的?速度是初始能量之1,要按位移的比例缩小?
  //根据velocity确定方向,需要*duration去获得开始时间
  //(F t)^2=stiffness(1-distance * distance)-velocity * velocity
  //stiffness * t * t=stiffness(1-distance * distance)-velocity * velocity
  // t * t=(1-distance * distance)-velocity * velocity / stiffness
  const diffE = (1 - distance * distance) - velocity * velocity / stiffness
  const diffTime = (diffE < 0 ? -1 : 1) * Math.sqrt(Math.abs(diffE))


  return superEnergy({
    velocity,
    distance,
    stiffness,
    friction,
    mass: 1,
  })
}

/**
 * initE=stiffness 
 * temp1=1
 * temp2=1-
 * @param t 
 * @returns 
 */
function simplify(t: number) {
  return 1 - Math.sqrt(1 - t * t)
}

/**
 * 是余弦归于0,还是归于最高位置?似乎归于最高位置更合适
 * @param n 
 * @param time 
 * @returns 
 */
export function getSingleCos(n: number, time: number) {
  const w = Math.PI * n / time / 2
  return function (t: number) {
    return Math.sin(w * t)
  }
}

/**
 * 这个动画就是
 * 标准结构:配置了起始、结束与时间
 * 动态开始:给定一个
 * 
 * 实时开始位置,要与时间偏移相同..
 * 
 * 
 * 是需要弦函数进行偏移的,弦函数表示位移,其微分函数是速度
 * 如果不进行偏移,则其初始速度0与位置相矛盾.
 * 因此速度分量变成弦函数的部分.
 * 而其能量仍然是
 */
function animateValue({
  velocity,
  from,
  flagFrom,
  to
}: {
  //实时触发的速度
  velocity?: number
  //实时触发的初始位置
  from: number
  //标准的初始位置
  flagFrom: number
  //目标
  to: number
}) {

}

/**
 * 
 * 1-(1-t)
 * 
 */
