export function getDestination(
  value: number,
  beginMargin: number,
  endMargin: number
) {
  if (value <= beginMargin) {
    return beginMargin;
  }
  if (endMargin <= value) {
    return endMargin;
  }
  return value;
}

/**
 * 返回最大可滚动高度
 * @param containerSize 容器高度
 * @param contentSize 滚动区域高度
 * @returns
 */
export function getMaxScroll(containerSize: number, contentSize: number) {
  return Math.max(contentSize - containerSize, 0);
}
