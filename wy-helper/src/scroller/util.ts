
export function getDestination(value: number, beginMargin: number, endMargin: number) {
  if (value <= beginMargin) {
    return beginMargin
  }
  if (endMargin <= value) {
    return endMargin
  }
  return value
}



