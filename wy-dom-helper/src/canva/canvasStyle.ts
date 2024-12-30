

export function getCanvasStyle(ctx: CanvasRenderingContext2D, v: CanvasDefineStyle) {
  if (typeof v == 'string') {
    return v
  } else if (v.type == 'pattern') {
    const n = ctx.createPattern(v.image, v.repetition || null)
    if (v.transform) {
      n?.setTransform(v.transform)
    }
    return n
  } else {
    let c!: CanvasGradient
    if (v.type == 'conicGradient') {
      c = ctx.createConicGradient(v.startAngle, v.x, v.y)
    } else if (v.type == 'linearGradient') {
      c = ctx.createLinearGradient(v.x0, v.y0, v.x1, v.y1)
    } else if (v.type == 'radialGradient') {
      c = ctx.createRadialGradient(v.x0, v.y0, v.r0, v.x1, v.y1, v.r1)
    }
    v.stops.forEach(stop => {
      c.addColorStop(stop[0], stop[1])
    })
    return c
  }
}

export type CanvasStyle = string | CanvasPattern | CanvasGradient
export type CanvasDefineStyle = string | CanvasPatternStyle | CanvasGradientStyle
/**
 * 方法用于使用指定的图像或重复创建图案
 */
export type CanvasPatternStyle = {
  type: "pattern",
  image: CanvasImageSource,
  /**默认是repeat,两个方向重复 */
  repetition?: "repeat" | "repeat-x" | "repea-y" | "no-repeat"
  transform?: DOMMatrix2DInit
}
export type CanvasGradientStyle = {
  type: "conicGradient",
  startAngle: number
  x: number
  y: number
  stops: [number, string][]
} | {
  type: "linearGradient"
  x0: number
  y0: number
  x1: number
  y1: number
  stops: [number, string][]
} | {
  type: "radialGradient"
  x0: number
  y0: number
  r0: number
  x1: number
  y1: number
  r1: number
  stops: [number, string][]
}
