
import { emptyObject } from "wy-helper"
import { CanvasStyle } from "./canvasStyle";
import LineBreaker from 'linebreak';

export type OCanvasTextDrawingStyles = Partial<Omit<CanvasTextDrawingStyles, 'font'>> & {
  //italic
  fontStyle?: string
  //small-caps
  fontVariant?: string
  //bold,600,700
  fontWeight?: string
  //16px
  fontSize?: string
  //Arial, sans-serif
  fontFamily?: string
}

function setDrawingStyle(
  ctx: CanvasTextDrawingStyles,
  n: OCanvasTextDrawingStyles = emptyObject as any,
  ig = false
) {
  if (!ig) {
    ctx.direction = n.direction || 'inherit'
    ctx.textBaseline = n.textBaseline || 'alphabetic'
    ctx.textAlign = n.textAlign || 'start'
  }
  const fontVS = []
  if (n.fontStyle) {
    fontVS.push(n.fontStyle)
  }
  if (n.fontVariant) {
    fontVS.push(n.fontVariant)
  }
  if (n.fontWeight) {
    fontVS.push(n.fontWeight)
  }
  if (n.fontSize) {
    fontVS.push(n.fontSize)
  }
  if (n.fontFamily) {
    fontVS.push(n.fontFamily)
  }
  ctx.font = fontVS.join(' ')
  ctx.fontKerning = n.fontKerning || 'auto'
  ctx.fontStretch = n.fontStretch || 'normal'
  ctx.fontVariantCaps = n.fontVariantCaps || 'normal'
  ctx.letterSpacing = n.letterSpacing || '0px'
  ctx.textRendering = n.textRendering || 'auto'
  ctx.wordSpacing = n.wordSpacing || '0px'
}

export type MeasuredTextout = {
  text: string
} & OCanvasTextDrawingStyles
export function measureText(
  ctx: MCtx,
  text: string,
  config?: OCanvasTextDrawingStyles) {
  setDrawingStyle(ctx, config)
  return ctx.measureText(text)
}

export type DrawTextExt = {
  style?: string | CanvasGradient | CanvasPattern,
  x?: number
  y?: number
  maxWidth?: number
  stroke?: boolean
}
export function drawText(
  ctx: TextCtx,
  out: MeasuredTextout,
  arg?: DrawTextExt
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  setDrawingStyle(ctx, out)
  const style = arg?.style || 'black'
  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = style
    fun = 'strokeText'
  } else {
    ctx.fillStyle = style
    fun = 'fillText'
  }
  ctx[fun](out.text, x, y)
}

export type MeasuredTextWrapOut = TextWrapTextConfig & {
  width: number
  height: number
  lineHeight: number
  lines: {
    width: number
    text: string
  }[]
}


type MCtx = CanvasTextDrawingStyles & {
  measureText(text: string): TextMetrics
}
export type TextWrapTextConfig = Omit<OCanvasTextDrawingStyles, 'direction' | 'textAlign' | 'textBaseline'>
export function measureTextWrap(
  ctx: MCtx,
  text: string,
  config: {
    lineHeight: number
    width: number
    maxLines?: number
  } & TextWrapTextConfig
): MeasuredTextWrapOut {
  let maxLines = config.maxLines || Infinity
  if (maxLines < 1) {
    maxLines = Infinity
  }
  setDrawingStyle(ctx, config, true)
  const m = ctx.measureText(text)

  if (m.width <= config.width) {
    return {
      ...config,
      width: m.width,
      lineHeight: config.lineHeight,
      height: config.lineHeight,
      lines: [
        {
          width: m.width,
          text: text
        }
      ]
    }
  } else {
    const breaker = new LineBreaker(text);
    let bk, lastBreak, tryLine, currentLine = '', lastMeasuredWidth
    const measuredSize = {
      ...config,
      height: 0,
      lines: [] as {
        width: number
        text: string
      }[]
    }
    while (bk = breaker.nextBreak()) {
      var word = text.slice(lastBreak ? lastBreak.position : 0, bk.position);
      tryLine = currentLine + word;
      const textMetrics = ctx.measureText(tryLine);
      if (textMetrics.width > config.width || (lastBreak && lastBreak.required)) {
        const line = {
          width: lastMeasuredWidth!,
          text: currentLine!.trim()
        }
        measuredSize.lines.push(line);
        if (measuredSize.lines.length == maxLines) {
          const rest = text.slice(bk.position).trim()
          if (rest) {
            line.text = line.text.replace(/\,?\s?\w+$/, '…');
            line.width = ctx.measureText(line.text).width
          }
          measuredSize.height = measuredSize.lines.length * config.lineHeight
          return measuredSize
        }

        currentLine = word;
        lastMeasuredWidth = ctx.measureText(currentLine.trim()).width;
      } else {
        currentLine = tryLine;
        lastMeasuredWidth = textMetrics.width;
      }
      lastBreak = bk;
    }
    currentLine = currentLine!.trim();
    if (currentLine.length > 0) {
      const textMetrics = ctx.measureText(currentLine);
      measuredSize.lines.push({ width: textMetrics.width, text: currentLine });
    }
    measuredSize.height = measuredSize.lines.length * config.lineHeight
    return measuredSize
  }
}

type TextCtx = CanvasTextDrawingStyles & {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillStyle) */
  fillStyle: CanvasStyle;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeStyle) */
  strokeStyle: CanvasStyle;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillText) */
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/strokeText) */
  strokeText(text: string, x: number, y: number, maxWidth?: number): void;
}


export type DrawTextWrapExt = {
  style?: CanvasStyle,
  x?: number
  y?: number
  stroke?: boolean
  direction?: 'ltr' | 'rtl'
  textAlign?: 'start' | 'center' | 'end'
}

export function drawTextWrap(
  ctx: TextCtx,
  out: MeasuredTextWrapOut,
  arg?: DrawTextWrapExt
) {
  const x = arg?.x || 0
  const y = arg?.y || 0
  setDrawingStyle(ctx, out, true)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const direction = arg?.direction || 'ltr'
  ctx.direction = direction


  let fun: 'strokeText' | 'fillText'
  if (arg?.stroke) {
    ctx.strokeStyle = arg.style || 'black'
    fun = 'strokeText'
  } else {
    ctx.fillStyle = arg?.style || 'black'
    fun = 'fillText'
  }
  let curY = y
  const textAlign = arg?.textAlign || 'left'
  for (let i = 0; i < out.lines.length; i++) {
    const line = out.lines[i]
    let curX = x
    if (textAlign == 'center') {
      curX = x + (out.width - line.width) / 2
    } else if (
      (textAlign == 'end' && direction == 'ltr') ||
      (textAlign == 'start' && direction == 'rtl')
    ) {
      curX = x + out.width - line.width
    }
    ctx[fun](line.text, curX, curY)
    curY += out.lineHeight
  }
}