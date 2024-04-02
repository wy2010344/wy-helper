export * from './timeoutAnimaton'
export * from './animateValue'
export * from './tween'
export * from './bezier'
export type AnimationConfig = {
  duration: number
  /**
   * 
   * @param n 时间的百分比
   * 返回位移的百分比
   */
  fn(n: number): number
}
