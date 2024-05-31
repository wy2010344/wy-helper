import { AnimationConfig, SpringOutValue } from "../animation"

export function getDestination(value: number, lowerMargin: number, upperMargin: number) {
  if (value <= lowerMargin) {
    return lowerMargin
  }
  if (upperMargin <= value) {
    return upperMargin
  }
  return value
}



