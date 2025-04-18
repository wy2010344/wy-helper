import { MDisplayOut, SizeKey } from "."
import { arrayReduceLeft, arrayReduceRight } from "../equal"
import { PointKey } from "../geometry"
import { getValueOrGet, memo, valueOrGetToGet } from "../signal"
import { cacheGetFun } from "../util"
import { AlignSelfFun, hookGetLayoutChildren } from "./util"

export type DisplayProps = {
  direction?: PointKey
  reverse?: boolean
  /**主轴方向固定时分布方式 */
  directionFix?: DirectionFix
  directionFixBetweenWhenOne?: DirectionFixBetweenWhenOne
  gap?: number



  alignItems?: AlignItem
  /**辅助轴方向是否固定 */
  alignFix?: boolean
}

export type DirectionFixBetweenWhenOne = 'center' | 'end' | 'start'

export type DirectionFix = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'

export type AlignItem = 'center' | 'start' | 'end' | 'stretch'

export function alignSelf(align: AlignItem): AlignSelfFun {
  return {
    position(pWidth, getSelfWidth) {
      if (align == 'center') {
        return (pWidth - getSelfWidth()) / 2
      } else if (align == 'end') {
        return (pWidth - getSelfWidth())
      } else {
        return 0
      }
    },
    size(pWidth) {
      if (align == 'stretch') {
        return pWidth
      }
      throw 'you should make your own size'
    }
  }
}
/**
 * 在ext里面使用align与grow,在控制在两个轴的伸长,还有notFlex
 * @param param0 
 * @returns 
 */
export function flexDisplayUtil(
  {
    direction = 'y',
    alignItems = 'center',
    gap = 0,
    alignFix = false,
    directionFix,
    directionFixBetweenWhenOne = 'start',
    reverse
  }: DisplayProps
): MDisplayOut {
  const info = hookGetLayoutChildren()
  const s = directionToSize(direction)
  const od = oppositeDirection(direction)
  const os = directionToSize(od)
  const getInfo = cacheGetFun(() => {
    return memo(() => {
      let length = 0
      const list: number[] = [0]
      const growIndex = new Map<number, number>()
      const childLengths: number[] = []

      let growAll = 0
      let totalLength = 0

      let children = info.children()
      const forEach = reverse ? arrayReduceRight : arrayReduceLeft
      children.forEach((child) => {
        const ext = child.getExt()
        const grow = getValueOrGet(ext.grow)
        if (typeof grow == 'number' && grow > 0) {
          growAll += grow
          growIndex.set(child.index(), grow)
        } else {
          totalLength = totalLength + child[s]()
        }
      })

      if (growAll) {
        let remaing = info[s]() - (gap * children.length - gap) - totalLength
        forEach(children, (child) => {
          const grow = growIndex.get(child.index())
          const childLength = grow
            ? remaing > 0
              ? remaing * grow / growAll
              : 0
            : child[s]()
          childLengths[child.index()] = childLength
          length = length + childLength + gap
          list.push(length)
        })
      } else if (directionFix) {
        let tGap = gap

        let allRemaing = info[s]() - totalLength
        let remaing = allRemaing - (gap * children.length - gap)

        if (directionFix == 'center') {
          list[0] = length = remaing / 2
        } else if (directionFix == 'end') {
          list[0] = length = remaing
        } else if (directionFix == 'around') {
          const rGap = allRemaing / children.length
          list[0] = length = rGap / 2
          tGap = rGap
        } else if (directionFix == 'between') {
          if (children.length > 1) {
            const rGap = allRemaing / (children.length - 1)
            tGap = rGap
          } else if (children.length == 1) {
            if (directionFixBetweenWhenOne == 'center') {
              list[0] = allRemaing / 2
            } else if (directionFixBetweenWhenOne == 'end') {
              list[0] = allRemaing
            }
          }
        } else if (directionFix == 'evenly') {
          const rGap = allRemaing / (children.length + 1)
          list[0] = length = rGap
          tGap = rGap
        }
        forEach(children, (child) => {
          const ext = child.getExt()
          const childLength = child[s]()
          childLengths[child.index()] = childLength
          length = length + childLength + tGap
          list.push(length)
        })
      } else {
        forEach(children, (child) => {
          const childLength = child[s]()
          childLengths[child.index()] = childLength
          length = length + childLength + gap
          list.push(length)
        })
        if (length) {
          length = length - gap
        }
      }
      list.pop()
      if (reverse) {
        list.reverse()
      }
      return {
        childLengths,
        list,
        growAll,
        length
      }
    })
  })
  const getWidth = cacheGetFun(() => {
    return memo(() => {
      let width = 0
      info.children().forEach((child) => {
        if (!alignFix) {
          const ext = child.getExt()
          const align = ext.align
          if (!align) {
            width = Math.max(child[os](), width)
          }
        }
      })
      return width
    })
  })
  //render两次,是伸缩长度在捣鬼,任何一处auto都有可能
  return {
    getChildInfo(x, i) {
      const child = info.children()[i]
      const ext = child.getExt()
      if (x == direction) {
        return getInfo().list[i]
      }
      if (x == s) {
        return getInfo().childLengths[i]
      }
      const theWidth = alignFix ? info[os]() : getWidth()
      const align = ext.align
      if (align) {
        //对于辅轴,开始与宽度,如y与height,x与width
        if (x == od) {
          return align.position(theWidth, child[os])
        }
        if (x == os) {
          return align.size(theWidth)
        }
      } else if (alignItems == 'stretch') {
        if (x == od) {
          return 0
        }
        if (x == os) {
          return theWidth
        }
      } else if (x == od) {
        if (alignItems == 'start') {
          return 0
        } else if (alignItems == 'center') {
          return (theWidth - child[os]()) / 2
        } else if (alignItems == 'end') {
          return theWidth - child[os]()
        }
      }
      throw ''
    },
    getInfo(x, def) {
      if (def) {
        return 0
      }
      if (x == s) {
        if (directionFix) {
          throw 'parent or self should make size for directionFix:' + directionFix
        }
        const { growAll, length } = getInfo()
        if (growAll != 0) {
          throw 'parent or self should make size for child has grow'
        }
        return length
      } else if (x == os) {
        if (alignFix) {
          throw 'self design fix'
        }
        return getWidth()
      }
      throw ''
    }
  }
}
function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return "width"
  } else {
    return "height"
  }
}
function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}