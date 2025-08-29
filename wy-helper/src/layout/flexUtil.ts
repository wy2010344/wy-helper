import { MDisplayOut, SizeKey } from '.'
import { arrayReduceLeft, arrayReduceRight } from '../equal'
import { PointKey } from '../geometry'
import { GetValue, objectMap } from '../setStateHelper'
import {
  getValueOrGet,
  memo,
  MemoFun,
  ValueOrGet,
  valueOrGetToGet,
} from '../signal'
import { alawaysGet } from '../tokenParser'
import { asLazy, cacheGetFun, emptyObject } from '../util'
import {
  AlignSelfFun,
  hookGetLayoutChildren,
  HookInfo,
  LayoutModel,
} from './util'

export type MainAxisConfig = {
  reverse?: boolean
  /**主轴方向固定时分布方式 */
  directionFix?: DirectionFix
  directionFixBetweenWhenOne?: DirectionFixBetweenWhenOne
  gap?: number
}
export type CrossAxisConfig = {
  alignItems?: AlignItem
  /**辅助轴方向尺寸是否固定 */
  alignFix?: boolean
}

export type DirectionFixBetweenWhenOne = 'center' | 'end' | 'start'

export type DirectionFix =
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly'

export type AlignItem = 'center' | 'start' | 'end' | 'stretch'

export function alignSelf(getAlign: ValueOrGet<AlignItem>): AlignSelfFun {
  const gAlign = valueOrGetToGet(getAlign)
  return {
    position(pWidth, getSelfWidth) {
      const align = gAlign()
      if (align == 'center') {
        return (pWidth - getSelfWidth()) / 2
      } else if (align == 'end') {
        return pWidth - getSelfWidth()
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
    },
  }
}

/**
 * 在ext里面使用align与grow,在控制在两个轴的伸长,还有notFlex
 * @param param0
 * @returns
 */
export function flexDisplayUtil<K extends string>(
  direction: K,
  axisConfig: MainAxisConfig = emptyObject,
  align: AlignItemsConfig<K> = emptyObject
): MDisplayOut<K> {
  return new FlexDisplay(direction, axisConfig, align)
}
function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return 'width'
  } else {
    return 'height'
  }
}

type AlignInfos<K extends string> = Record<
  K,
  {
    alignItems: AlignItem
    alignFix: boolean
    get: GetValue<number>
  }
>

type AlignItemsConfig<K extends string> = {
  [key in K]?: CrossAxisConfig
} & CrossAxisConfig

const lazy0 = asLazy(0)
class StackDisplay<K extends string> implements MDisplayOut<K> {
  protected info: HookInfo<K>
  private alignInfos: AlignInfos<K> = {} as any
  constructor(align: AlignItemsConfig<K>) {
    this.info = hookGetLayoutChildren() as HookInfo<K>
    const { alignItems: dAlignItems = 'center', alignFix: dAlignFix = false } =
      align
    this.info.forEach((key) => {
      const { alignItems = dAlignItems, alignFix = dAlignFix } =
        align[key] || (emptyObject as CrossAxisConfig)
      this.createAlignInfo(key, alignItems, alignFix)
    })
  }

  protected createAlignInfo(key: K, alignItems: AlignItem, alignFix: boolean) {
    this.alignInfos[key] = {
      alignItems,
      alignFix,
      get: cacheGetFun(() => {
        if (alignFix) {
          return lazy0
        }
        return memo(() => {
          let width = 0
          this.info.children().forEach((child) => {
            const align = child.getAlign(key as K)
            if (!align) {
              width = Math.max(
                child.getOuterSizeForParentLayout(key as K),
                width
              )
            }
          })
          return width
        })
      }),
    }
  }

  getChildInfo(x: K, size: boolean, i: number): number {
    const child = this.info.children()[i]
    const { alignFix, get, alignItems } = this.alignInfos[x]
    const theWidth = alignFix ? this.info.getInnerSizeToLayout(x) : get()
    const align = child.getAlign(x)
    if (align) {
      //对于辅轴,开始与宽度,如y与height,x与width
      if (size) {
        return align.size(theWidth)
      } else {
        return align.position(theWidth, () =>
          child.getOuterSizeForParentLayout(x)
        )
      }
    }

    if (alignItems == 'stretch') {
      if (size) {
        return theWidth
      } else {
        return 0
      }
    }

    if (size) {
      throw `child should have it's own size`
    }

    if (alignItems == 'start') {
      return 0
    }
    if (alignItems == 'center') {
      return (theWidth - child.getOuterSizeForParentLayout(x)) / 2
    }
    if (alignItems == 'end') {
      return theWidth - child.getOuterSizeForParentLayout(x)
    }
    throw 'never reach'
  }
  getSizeInfo(x: K, def?: boolean): number {
    if (def) {
      return 0
    }
    const { alignFix, get } = this.alignInfos[x]
    if (alignFix) {
      throw `self sould have it's own size`
    }
    return get()
  }
}
export function stackDisplayUtil<K extends string>(
  align: {
    [key in K]?: CrossAxisConfig
  } = emptyObject
): MDisplayOut<K> {
  return new StackDisplay(align)
}

class FlexDisplay<K extends string> extends StackDisplay<K> {
  constructor(
    private direction: K,
    private axisConfig: MainAxisConfig,
    align: {
      [P in K]?: CrossAxisConfig
    }
  ) {
    super(align as Record<K, CrossAxisConfig>)
  }

  protected createAlignInfo(
    key: K,
    alignItems: AlignItem,
    alignFix: boolean
  ): void {
    if (key == this.direction) {
      return
    }
    super.createAlignInfo(key, alignItems, alignFix)
  }

  private itGetInfo = cacheGetFun(() => {
    const {
      gap = 0,
      directionFix,
      directionFixBetweenWhenOne = 'start',
      reverse,
    } = this.axisConfig
    const direction = this.direction
    return memo(() => {
      let length = 0
      const list: number[] = [0]
      const growIndex = new Map<number, number>()
      const childLengths: number[] = []

      let growAll = 0
      let totalLength = 0

      let children = this.info.children()
      const forEach = reverse ? arrayReduceRight : arrayReduceLeft
      children.forEach((child) => {
        const grow = child.getGrow()
        if (typeof grow == 'number' && grow > 0) {
          growAll += grow
          growIndex.set(child.index(), grow)
        } else {
          totalLength =
            totalLength + child.getOuterSizeForParentLayout(direction)
        }
      })

      if (growAll) {
        let remaing =
          this.info.getInnerSizeToLayout(direction) -
          (gap * children.length - gap) -
          totalLength
        forEach(children, (child) => {
          const grow = growIndex.get(child.index())
          const childLength = grow
            ? remaing > 0
              ? (remaing * grow) / growAll
              : 0
            : child.getOuterSizeForParentLayout(direction)
          childLengths[child.index()] = childLength
          length = length + childLength + gap
          list.push(length)
        })
      } else if (directionFix) {
        let tGap = gap

        let allRemaing = this.info.getInnerSizeToLayout(direction) - totalLength
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
          const childLength = child.getOuterSizeForParentLayout(direction)
          childLengths[child.index()] = childLength
          length = length + childLength + tGap
          list.push(length)
        })
      } else {
        forEach(children, (child) => {
          const childLength = child.getOuterSizeForParentLayout(direction)
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
        length,
      }
    })
  })
  getChildInfo(x: K, size: boolean, i: number): number {
    if (x == this.direction) {
      if (size) {
        return this.itGetInfo().childLengths[i]
      } else {
        return this.itGetInfo().list[i]
      }
    }
    return super.getChildInfo(x, size, i)
  }
  getSizeInfo(x: K, def?: boolean): number {
    if (def) {
      return 0
    }
    if (x == this.direction) {
      if (this.axisConfig.directionFix) {
        throw (
          'parent or self should make size for directionFix:' +
          this.axisConfig.directionFix
        )
      }
      const { growAll, length } = this.itGetInfo()
      if (growAll != 0) {
        throw 'parent or self should make size for child has grow'
      }
      return length
    }
    return super.getSizeInfo(x, def)
  }
}
