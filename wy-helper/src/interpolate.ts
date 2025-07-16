import { mixNumber } from "./NumberHelper"
import { BGColor, mixColor } from "./color"
import { arrayReduceRight } from "./equal"

type OverClip<T> = (x: number, low: boolean, latest1: InterpolateRangeT<T>, latest2: InterpolateRangeT<T>) => T

function toNumberOrRemove<T>(row: [string, T], i: number, array: [string, T][]) {
  const key = Number(row[0])
  if (isNaN(key)) {
    array.splice(i, 1)
  } else {
    row[0] = key as any
  }
}

type InterpolateRangeT<T> = [number, T]
function sortArray<T>(a: InterpolateRangeT<T>, b: InterpolateRangeT<T>) {
  return a[0] - b[0]
}

type MixValue<T> = (from: T, to: T, percent: number) => T
function getInterpolateT<T>(
  map: Record<number, T>,
  overclip: OverClip<T>,
  mixValue: MixValue<T>
) {
  const _array = Object.entries(map)
  arrayReduceRight(_array, toNumberOrRemove)
  const array = _array as unknown as InterpolateRangeT<T>[]
  if (array.length < 2) {
    throw new Error("至少需要两个参数")
  }
  array.sort(sortArray)
  return function (x: number) {
    for (let i = 0; i < array.length; i++) {
      const row = array[i]
      if (x < row[0]) {
        //取这个
        if (i == 0) {
          return overclip(x, true, array[0], array[1])
        } else {
          const last = array[i - 1]
          return mapInterpolateExtend(x, last, row, mixValue)
        }
      }
    }
    return overclip(x, false, array.at(-2)!, array.at(-1)!)
  }
}


export function mapInterpolateExtend<T>(
  x: number,
  last: InterpolateRangeT<T>,
  row: InterpolateRangeT<T>,
  mixValue: MixValue<T>
) {
  return mixValue(last[1], row[1], (x - last[0]) / (row[0] - last[0]))
}

export const extrapolationClamp: OverClip<any> = (x, low, last, row) => {
  if (low) {
    return last[1]
  } else {
    return row[1]
  }
}
/**
 * https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolate
 * @param mixValue 
 * @returns 
 */
export function getExtrapolationExtend<T>(mixValue: MixValue<T>): OverClip<T> {
  return (x, low, last, row) => {
    return mapInterpolateExtend(x, last, row, mixValue)
  }
}

export const extrapolationIdentity: OverClip<number> = (x, low, last, row) => {
  return x
}

export const extrapolationExtend = getExtrapolationExtend(mixNumber)

export function extrapolationCombine(
  whenLow: OverClip<number>,
  whenTop: OverClip<number>
): OverClip<number> {
  return function (x, low, last, row) {
    if (low) {
      return whenLow(x, true, last, row)
    } else {
      return whenTop(x, low, last, row)
    }
  }
}

export function getInterpolate(
  map: Record<number, number>,
  overclip: OverClip<number>,
) {
  return getInterpolateT(map, overclip, mixNumber)
}
export function getInterpolateColor(
  map: Record<number, BGColor>,
  overclip: OverClip<BGColor>,
) {
  return getInterpolateT(map, overclip, mixColor)
}