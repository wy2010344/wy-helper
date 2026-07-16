import { ReadArray } from '../util';

export interface Layout {
  sizeFromChildren(): number;
  childSize(i: number): number;
  childPosition(i: number): number;
}

export interface LayoutInsideObject<T> {
  sizeFromParent(): boolean;
  children(): Array<T>;
  innerSize(): number;
}

export class LayoutError extends Error {}
