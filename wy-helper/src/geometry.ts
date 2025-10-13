import { mixNumber } from './NumberHelper';
import { Compare, simpleEqual } from './equal';
import { mathAdd } from './util';

export interface Point<T = number> {
  x: T;
  y: T;
}

export type PointKey = keyof Point;

export const pointZero = {
  x: 0,
  y: 0,
};

export function pointEqual<T>(
  a: Point<T>,
  b: Point<T>,
  eq: Compare<T> = simpleEqual
) {
  if (a == b) {
    return true;
  }
  return eq(a.x, b.x) && eq(a.y, b.y);
}

export function pointOperate<T, F>(
  a: Point<T>,
  b: Point<T>,
  op: (a: T, b: T) => F
): Point<F> {
  return {
    x: op(a.x, b.x),
    y: op(a.y, b.y),
  };
}
export function operateAdd(a: number, b: number) {
  return a + b;
}
export function operateSub(a: number, b: number) {
  return a - b;
}
/**
 * 轴,最小与最大
 */
export interface Axis<T = number> {
  min: T;
  max: T;
}

export const axisZero = {
  min: 0,
  max: 0,
};

export function axisEqual<T>(
  a: Axis<T>,
  b: Axis<T>,
  eq: Compare<T> = simpleEqual
) {
  if (a == b) {
    return true;
  }
  return eq(a.min, b.min) && eq(a.max, b.max);
}
/**
 * 一个盒子,由两个轴上的最大小最确定
 * 需要也可以用两个点确定
 */
export interface Box<T = number> {
  x: Axis<T>;
  y: Axis<T>;
}

export const boxZero = {
  x: axisZero,
  y: axisZero,
};
export function boxEqual<T>(
  a: Box<T>,
  b: Box<T>,
  eq: Compare<T> = simpleEqual
) {
  if (a == b) {
    return true;
  }
  return axisEqual(a.x, b.x, eq) && axisEqual(a.y, b.y, eq);
}
/**
 * getBoundingClientRect 里面,left+width=right,right是相对左边的坐标!
 */
export interface BoundingBox<T = number> {
  top: T;
  right: T;
  bottom: T;
  left: T;
}
export type BoundingBoxKey = keyof BoundingBox;

export const boundingBoxZero = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function boundingBoxEqual<T>(
  a: BoundingBox<T>,
  b: BoundingBox<T>,
  eq: Compare<T> = simpleEqual
) {
  if (a == b) {
    return true;
  }
  return (
    eq(a.top, b.top) &&
    eq(a.bottom, b.bottom) &&
    eq(a.left, b.left) &&
    eq(a.right, b.right)
  );
}

export function convertBoundingBoxToBox<T>({
  left,
  right,
  top,
  bottom,
}: BoundingBox<T>): Box<T> {
  return {
    x: { min: left, max: right },
    y: { min: top, max: bottom },
  };
}

export function convertBoxToBoundingBox<T>({ x, y }: Box<T>): BoundingBox<T> {
  return {
    top: y.min,
    bottom: y.max,
    left: x.min,
    right: x.max,
  };
}

export function pointAddNumber(a: Point, b: Point): Point {
  return pointOperate(a, b, mathAdd);
}

export function mixPointNumber(a: Point, b: Point, c: number): Point {
  return {
    x: mixNumber(a.x, b.x, c),
    y: mixNumber(a.y, b.y, c),
  };
}
