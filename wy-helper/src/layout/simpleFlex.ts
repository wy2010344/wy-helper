

/**
 * 假设有N维
 * 那个flex就会指向维度
 * N维以map还是list?
 * 自定义key还是数字?
 */

import { PointKey } from "../geometry"
import { emptyObject } from "../util"
import { AlignItem, CrossAxisConfig, DirectionFix, DirectionFixBetweenWhenOne, flexDisplayUtil, MainAxisConfig, stackDisplayUtil } from "./flexUtil"


export function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}

export type DisplayProps = MainAxisConfig & {
  direction?: PointKey
} & CrossAxisConfig
export function simpleFlex({
  direction = 'y',
  alignFix,
  alignItems,
  ...args
}: DisplayProps) {
  return flexDisplayUtil(direction, args, {
    alignFix,
    alignItems
  })
}


export function simpleStack({
  alignFix,
  alignItems,
  alignFixX = alignFix,
  alignFixY = alignFix,
  alignItemsX = alignItems,
  alignItemsY = alignItems
}: {
  alignItems?: AlignItem
  alignFix?: boolean,
  alignFixX?: boolean
  alignFixY?: boolean
  alignItemsX?: AlignItem,
  alignItemsY?: AlignItem
}) {
  return stackDisplayUtil<PointKey>({
    x: {
      alignFix: alignFixX,
      alignItems: alignItemsX
    },
    y: {
      alignFix: alignFixY,
      alignItems: alignItemsY
    }
  })
}
/**
 * stack布局,相当于没有主轴,都是辅助轴
 * 在3D中,Z轴上flex,看上z轴,则是重叠
 * 但3D有自己的stack.
 * 2D也有stack
 * 比较常用,是stretch下,多个块都重在一起.
 */