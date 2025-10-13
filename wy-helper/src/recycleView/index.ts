import { GetValue } from '../setStateHelper';
import { ReadArray } from '../util';

export * from './recycleScrollView';

export function circleFindNearst(diff: number, max: number) {
  if (diff < -max / 2) {
    return max + diff;
  } else if (diff > max / 2) {
    return diff - max;
  }
  return diff;
}

/**
 *
 * @param n 0~max-1,加上一个值
 * @param max 总数量
 * @returns 0~max-1
 */
export function circleFormat(n: number, max: number) {
  if (max) {
    n = n % max;
    if (n < 0) {
      return max + n;
    }
    return n;
  }
  return 0;
}

/**
 * 从列表中取出一部分作为虚拟列表的展示
 * @param array
 * @param getScroll
 * @param getContainerSize
 * @param getSize
 * @returns {
 *  paddingBegin:容器的paddingBegin设值
 *  beginIndex,endIndex:for(let i=beginIndex;i<endIndex;i++){
 *    render(list[i])
 *  }
 * }
 */
export function getSubListForVirtualList<T>(
  array: ReadArray<T>,
  scroll: number,
  containerSize: number,
  getSize: (n: T) => number
) {
  let accHeight = 0;
  let notBegin = true;
  let beginIndex = 0;
  let endIndex = array.length;
  let paddingBegin = 0;
  for (let i = 0; i < array.length; i++) {
    const row = array[i];
    const size = getSize(row);
    accHeight = accHeight + size;
    if (notBegin) {
      if (accHeight > scroll) {
        notBegin = false;
        paddingBegin = accHeight - size;
        beginIndex = i;
      }
    }
    if (accHeight - scroll > containerSize) {
      endIndex = i + 1;
      break;
    }
  }
  return {
    paddingBegin,
    beginIndex,
    endIndex,
  };
}
