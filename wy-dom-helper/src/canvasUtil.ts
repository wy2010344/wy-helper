
export type RoundedRectParam = {
  x: number,
  y: number,
  width: number,
  height: number
  tl: number
  tr: number
  bl: number
  br: number
}
export function drawRoundedRect(
  context: Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'closePath'>,
  {
    x,
    y,
    width,
    height,
    tl,
    tr,
    bl,
    br
  }: RoundedRectParam
) {
  context.moveTo(x + tl, y);
  context.lineTo(x + width - tr, y);
  context.quadraticCurveTo(x + width, y, x + width, y + tr);
  context.lineTo(x + width, y + height - br);
  context.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  context.lineTo(x + bl, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - bl);
  context.lineTo(x, y + tl);
  context.quadraticCurveTo(x, y, x + tl, y);
  context.closePath();
}

export function roundRect(a: RoundedRectParam, s: number) {
  a.tl = s
  a.tr = s
  a.bl = s
  a.br = s
}

export function roundRectBlock(a: RoundedRectParam, s: number, y: number) {
  a.tl = s
  a.tr = s
  a.bl = y
  a.br = y
}

export function roundRectInline(a: RoundedRectParam, s: number, y: number) {
  a.tl = s
  a.tr = y
  a.bl = s
  a.br = y
}




function getCanvasStyle(ctx: CanvasRenderingContext2D, v: CanvasStyle) {
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
export type CanvasStyle = string | CanvasPatternStyle | CanvasGradientStyle
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


export type Path2DOperate = {
  type: "stroke",
  width: number
  style: CanvasStyle
} | {
  type: "fill"
  style: CanvasStyle,
  rule?: CanvasFillRule
} | {
  type: "draw"
  callback(ctx: CanvasRenderingContext2D): void
}
export function path2DOperate(ctx: CanvasRenderingContext2D, path: Path2D, ops: readonly Path2DOperate[]) {
  ops.forEach(op => {
    if (op.type == 'fill') {
      const style = getCanvasStyle(ctx, op.style)
      if (style) {
        ctx.fillStyle = style
        ctx.fill(path, op.rule)
      }
    } else if (op.type == 'stroke') {
      //在两边各占一半
      if (op.width > 0) {
        const style = getCanvasStyle(ctx, op.style)
        if (style) {
          ctx.lineWidth = op.width
          ctx.strokeStyle = style
          ctx.stroke(path)
        }
      }
    } else if (op.type == 'draw') {
      op.callback(ctx)
    }
  })
}

export function path2DOperatesHasClip(ops: Path2DOperate[]) {
  return ops.some(v => v.type == 'stroke')
}