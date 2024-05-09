

/**
 * 
 * @param order 
 * @param getKey 
 * @param getHeight 
 * @param key 
 * @param offset 偏移量
 * @param speed 速度决定判断的方向
 * @returns 
 */
export function reorderCheckTarget<T>(
  order: T[],
  getKey: (n: T, i: number) => any,
  getHeight: (n: T, i: number) => number,
  key: any,
  offset: number,
  speed: number,
  gap = 0
) {
  'worklet';
  gap = Math.abs(gap)
  //速度为0时,不调整
  if (!speed) {
    return
  }
  const index = order.findIndex((item, i) => getKey(item, i) == key)
  if (index < 0) {
    return
  }
  const nextOffset = speed > 0 ? 1 : -1

  let nextHeightOffset = gap * nextOffset
  let flagIndex = index
  while (flagIndex > -1 && flagIndex < order.length) {
    const nextIndex = flagIndex + nextOffset
    const nextItem = order[nextIndex]
    if (!nextItem) {
      break
    }

    const nextHeight = getHeight(nextItem, nextIndex)
    const nextHeightCenter = nextHeight / 2
    if (
      (nextOffset > 0 && offset > nextHeightOffset + nextHeightCenter) ||
      (nextOffset < 0 && offset < nextHeightOffset - nextHeightCenter)
    ) {
      flagIndex = nextIndex
      nextHeightOffset += ((nextHeight + gap) * nextOffset)
    } else {
      break
    }
  }
  if (flagIndex != index) {
    return [index, flagIndex] as const
  }
}

