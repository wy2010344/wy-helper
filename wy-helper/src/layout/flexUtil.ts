import { MDisplayOut, SizeKey } from "."
import { PointKey } from "../geometry"
import { hookGetLayoutChildren } from "./util"

export type DisplayProps = {
  direction?: PointKey
  alignItems?: 'center' | 'start' | 'end'
  gap?: number
}

export function flexDisplayUtil(
  {
    direction = 'y',
    alignItems = 'center',
    gap = 0
  }: DisplayProps
): MDisplayOut {
  let length = 0
  let width = 0
  const list: number[] = [0]
  const d = direction
  const s = directionToSize(d)
  const od = oppositeDirection(d)
  const os = directionToSize(od)
  const ai = alignItems
  const getChildren = hookGetLayoutChildren()
  getChildren().forEach(child => {
    length = length + child[s]() + gap
    list.push(
      length
    )
    width = Math.max(child[os](), width)
  })
  if (length) {
    length = length - gap
  }
  //render两次,是伸缩长度在捣鬼,任何一处auto都有可能
  // console.log("执行一次", list, d, n.children().length, n.index())
  return {
    getChildInfo(x, i) {
      // console.log("get", x, i)
      if (x == d) {
        const row = list[i]
        return row
      }
      if (x == od) {
        if (ai == 'start') {
          return 0
        } else if (ai == 'center') {
          const child = getChildren()[i]
          return (width - child[os]()) / 2
        } else if (ai == 'end') {
          const child = getChildren()[i]
          return width - child[os]()
        }
      }
      throw ''
    },
    getInfo(x) {
      // console.log("gext", x)
      if (x == s) {
        return length
      } else if (x == os) {
        return width
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