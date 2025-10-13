import { CanvasDefineStyle, getCanvasStyle } from './canvasStyle';

export type Path2DOperate =
  | {
      type: 'stroke';
      width: number;
      style: CanvasDefineStyle;
    }
  | {
      type: 'fill';
      style: CanvasDefineStyle;
      rule?: CanvasFillRule;
    }
  | {
      type: 'draw';
      callback(ctx: CanvasRenderingContext2D): void;
    };
export function path2DOperate(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  ops: readonly Path2DOperate[]
) {
  ops.forEach(op => {
    if (op.type == 'fill') {
      const style = getCanvasStyle(ctx, op.style);
      if (style) {
        ctx.fillStyle = style;
        ctx.fill(path, op.rule);
      }
    } else if (op.type == 'stroke') {
      //在两边各占一半
      if (op.width > 0) {
        const style = getCanvasStyle(ctx, op.style);
        if (style) {
          ctx.lineWidth = op.width;
          ctx.strokeStyle = style;
          ctx.stroke(path);
        }
      }
    } else if (op.type == 'draw') {
      op.callback(ctx);
    }
  });
}
