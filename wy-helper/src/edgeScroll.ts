import { Point } from ".";


export type EdgeScrollPureCfg = {
  padding: number
}
export type EdgeScrollAxis = EdgeScrollPureCfg | boolean

export type EdgeScrollBox = {
  min?: EdgeScrollAxis
  max?: EdgeScrollAxis
} | boolean

function getCfg(padding: number, dir: 'min' | 'max', M?: EdgeScrollBox): EdgeScrollPureCfg | void {
  if (M == true) {
    return {
      padding
    }
  }
  if (typeof M == 'object' && M[dir]) {
    const MDir = M[dir]
    if (MDir == true) {
      return {
        padding
      }
    }
    if (typeof MDir == 'object') {
      return {
        padding: MDir.padding
      }
    }
  }
}

export type EdgeScrollConfig = {
  padding?: number
  x?: EdgeScrollBox
  y?: EdgeScrollBox
}
export function edgeScrollChange(
  cp: Point,
  getRect: () => {
    top: number
    left: number
    right: number
    bottom: number
  },
  config: EdgeScrollConfig,
  set: (dir: 'top' | 'left', diff: number) => void
) {
  const rect = getRect()
  const padding = config.padding || 0
  const yMin = getCfg(padding, 'min', config.y)
  if (yMin) {
    const diffTop = rect.top + yMin.padding - cp.y
    if (diffTop > 0) {
      set('top', -diffTop)
    }
  }
  const yMax = getCfg(padding, 'max', config.y)
  if (yMax) {
    const diffBottom = rect.bottom - yMax.padding - cp.y
    if (diffBottom < 0) {
      set('top', -diffBottom)
    }
  }
  const xMin = getCfg(padding, 'min', config.x)
  if (xMin) {
    const diffLeft = rect.left + xMin.padding - cp.x
    if (diffLeft > 0) {
      set('left', -diffLeft)
    }
  }
  const xMax = getCfg(padding, 'max', config.x)
  if (xMax) {
    const diffRight = rect.right - xMax.padding - cp.x
    if (diffRight < 0) {
      set('left', -diffRight)
    }
  }
}