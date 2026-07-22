export interface Layout {
  sizeFromChildren(): number;
  childSize(i: number): number;
  childPosition(i: number): number;
  allowSizeFromChildren(): boolean;
}

export interface LayoutInsideObject<T> {
  children(): readonly T[];
  innerSize(): number;
}

export class LayoutError extends Error {}

export interface LayoutFun<T> {
  createLayout(o: LayoutInsideObject<T>): Layout;
}
