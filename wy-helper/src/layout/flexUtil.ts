import { MDisplayOut, SizeKey } from "."
import { arrayReduceLeft, arrayReduceRight } from "../equal"
import { PointKey } from "../geometry"
import { objectMap } from "../setStateHelper"
import { getValueOrGet, memo, MemoFun, ValueOrGet, valueOrGetToGet } from "../signal"
import { cacheGetFun } from "../util"
import { AlignSelfFun, hookGetLayoutChildren, HookInfo } from "./util"


export type MainAxisConfig = {
  reverse?: boolean
  /**主轴方向固定时分布方式 */
  directionFix?: DirectionFix
  directionFixBetweenWhenOne?: DirectionFixBetweenWhenOne
  gap?: number

}
export type CrossAxisConfig = {
  alignItems?: AlignItem
  /**辅助轴方向是否固定 */
  alignFix?: boolean
}

export type DirectionFixBetweenWhenOne = 'center' | 'end' | 'start'

export type DirectionFix = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'

export type AlignItem = 'center' | 'start' | 'end' | 'stretch'

export function alignSelf(getAlign: ValueOrGet<AlignItem>): AlignSelfFun {
  const gAlign = valueOrGetToGet(getAlign)
  return {
    position(pWidth, getSelfWidth) {
      const align = gAlign()
      if (align == 'center') {
        return (pWidth - getSelfWidth()) / 2
      } else if (align == 'end') {
        return (pWidth - getSelfWidth())
      } else {
        return 0
      }
    },
    size(pWidth) {
      const align = gAlign()
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
export function flexDisplayUtil<K extends string>(
  direction: K,
  {
    gap = 0,
    directionFix,
    directionFixBetweenWhenOne = 'start',
    reverse,
  }: MainAxisConfig,
  align: Record<K, CrossAxisConfig>
): MDisplayOut<K> {
  const info = hookGetLayoutChildren() as HookInfo<K>
  // const s = directionToSize(direction)
  // const od = oppositeDirection(direction)
  // const os = directionToSize(od)
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
        const grow = child.getGrow()
        if (typeof grow == 'number' && grow > 0) {
          growAll += grow
          growIndex.set(child.index(), grow)
        } else {
          totalLength = totalLength + child.getSize(direction)
        }
      })

      if (growAll) {
        let remaing = info.getSize(direction) - (gap * children.length - gap) - totalLength
        forEach(children, (child) => {
          const grow = growIndex.get(child.index())
          const childLength = grow
            ? remaing > 0
              ? remaing * grow / growAll
              : 0
            : child.getSize(direction)
          childLengths[child.index()] = childLength
          length = length + childLength + gap
          list.push(length)
        })
      } else if (directionFix) {
        let tGap = gap

        let allRemaing = info.getSize(direction) - totalLength
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
          const childLength = child.getSize(direction)
          childLengths[child.index()] = childLength
          length = length + childLength + tGap
          list.push(length)
        })
      } else {
        forEach(children, (child) => {
          const childLength = child.getSize(direction)
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

  const getAlign: Record<K, {
    alignItems: AlignItem,
    alignFix: boolean
    get: MemoFun<number>
  }> = objectMap(align, function ({
    alignItems = 'center',
    alignFix = false
  }, key) {
    return {
      alignItems,
      alignFix,
      get: cacheGetFun(() => {
        return memo(() => {
          let width = 0
          info.children().forEach((child) => {
            if (!alignFix) {
              const align = child.getAlign(key as K)
              if (!align) {
                width = Math.max(child.getSize(key as K), width)
              }
            }
          })
          return width
        })
      })
    }
  })
  //render两次,是伸缩长度在捣鬼,任何一处auto都有可能
  return {
    getChildInfo(x, size, i) {
      const child = info.children()[i]
      if (x == direction) {
        if (size) {
          return getInfo().childLengths[i]
        } else {
          return getInfo().list[i]
        }
      }
      const cf = getAlign[x]
      const theWidth = cf.alignFix ? info.getSize(x) : cf.get()
      const align = child.getAlign(x)
      if (align) {
        //对于辅轴,开始与宽度,如y与height,x与width
        if (size) {
          return align.size(theWidth)
        } else {
          return align.position(theWidth, () => child.getSize(x))
        }
      } else if (cf.alignItems == 'stretch') {
        if (size) {
          return theWidth
        } else {
          return 0
        }
      } else {
        if (cf.alignItems == 'start') {
          return 0
        } else if (cf.alignItems == 'center') {
          return (theWidth - child.getSize(x)) / 2
        } else if (cf.alignItems == 'end') {
          return theWidth - child.getSize(x)
        }
      }
      throw ''
    },
    getInfo(x, def) {
      if (def) {
        return 0
      }
      if (x == direction) {
        if (directionFix) {
          throw 'parent or self should make size for directionFix:' + directionFix
        }
        const { growAll, length } = getInfo()
        if (growAll != 0) {
          throw 'parent or self should make size for child has grow'
        }
        return length
      } else {
        const cf = getAlign[x]
        if (cf.alignFix) {
          throw 'self design fix'
        }
        return cf.get()
      }
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