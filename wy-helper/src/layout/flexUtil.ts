import { MDisplayOut, SizeKey } from "."
import { PointKey } from "../geometry"
import { memo } from "../signal"
import { hookGetLayoutChildren } from "./util"

export type DisplayProps = {
  direction?: PointKey
  alignItems?: 'center' | 'start' | 'end'
  gap?: number
  alignFix?: boolean
}

export function flexDisplayUtil(
  {
    direction = 'y',
    alignItems = 'center',
    gap = 0,
    alignFix = false
  }: DisplayProps
): MDisplayOut {

  const info = hookGetLayoutChildren()
  const d = direction
  const s = directionToSize(d)
  const od = oppositeDirection(d)
  const os = directionToSize(od)
  const ai = alignItems

  const getInfo = memo(() => {

    let length = 0
    const list: number[] = [0]
    const growIndex = new Map<number, number>()
    const childLengths: number[] = []

    let growAll = 0
    let totalLength = 0
    info.children().forEach((child, i) => {
      const grow = child.getExt().grow
      if (typeof grow == 'number' && grow > 0) {
        growAll += grow
        growIndex.set(i, grow)
      } else {
        totalLength = totalLength + child[s]()
      }
    })
    if (growAll) {
      let remaing = info[s]() - (gap * info.children().length - gap) - totalLength
      info.children().forEach((child, i) => {
        const grow = growIndex.get(i)
        const childLength = grow
          ? remaing > 0
            ? remaing * grow / growAll
            : 0
          : child[s]()
        childLengths.push(childLength)

        length = length + childLength + gap
        list.push(length)
      })
    } else {
      info.children().forEach((child, i) => {
        const childLength = child[s]()
        childLengths.push(childLength)
        length = length + childLength + gap
        list.push(length)
      })
      if (length) {
        length = length - gap
      }
    }
    return {
      childLengths,
      list,
      growAll,
      length
    }
  })
  const getWidth = memo(() => {
    let width = 0
    info.children().forEach((child, i) => {
      if (!alignFix) {
        const stretch = child.getExt().stretch
        if (!stretch) {
          width = Math.max(child[os](), width)
        }
      }
    })
    return width
  })
  //render两次,是伸缩长度在捣鬼,任何一处auto都有可能
  // console.log("执行一次", list, d, n.children().length, n.index())
  return {
    getChildInfo(x, i) {
      // console.log("get", x, i)
      if (x == d) {
        return getInfo().list[i]
      }
      if (x == s) {
        return getInfo().childLengths[i]
      }
      const child = info.children()[i]
      const theWidth = alignFix ? info[os]() : getWidth()
      const stretch = child.getExt().stretch
      if (stretch) {
        return stretch(x, theWidth)
      } else if (x == od) {
        if (ai == 'start') {
          return 0
        } else if (ai == 'center') {
          return (theWidth - child[os]()) / 2
        } else if (ai == 'end') {
          return theWidth - child[os]()
        }
      }
      throw ''
    },
    getInfo(x) {
      // console.log("gext", x)
      if (x == s) {
        const { growAll, length } = getInfo()
        if (growAll != 0) {
          throw 'parent should make size'
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