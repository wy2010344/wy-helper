
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
  context: Pick<CanvasRenderingContext2D, 'beginPath' | 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'closePath'>,
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

  context.beginPath();
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