/**
 * 
 * @param from 开始
 * @param to 结束
 * @param progress 比例 
 */
export function mixNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}