import { arrayReduceLeft, arrayReduceRight } from '..';
import { GetValue } from '../setStateHelper';
import { memo } from '../signal';
import { Layout, LayoutInsideObject } from './layout';
import { StackChildConvert } from './stack';

export type DirectionFixBetweenWhenOne = 'center' | 'end' | 'start';

export type DirectionJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly';

export interface FlexChildConvert<T> {
  index(n: T): number;
  grow(n: T): number;
  outerSize(n: T): number;
}

export class FlexLayout<T> implements Layout {
  constructor(
    private arg: {
      reverse(): boolean;
      gap(): number;
      directionJustify(): DirectionJustify;
      directionFixBetweenWhenOne(): DirectionFixBetweenWhenOne;
    },
    private inside: LayoutInsideObject<T>,
    private convert: FlexChildConvert<T>
  ) {
    this.cache = memo(() => {
      const reverse = arg.reverse();
      let length = 0;
      const list: number[] = [0];
      const childLengths: number[] = [];

      const children = inside.children();
      const forEach = reverse ? arrayReduceRight : arrayReduceLeft;

      var insideSize = 0;
      var getInsideSize = true;
      try {
        insideSize = inside.innerSize();
      } catch (err) {
        getInsideSize = false;
      }

      const gap = arg.gap();
      if (getInsideSize) {
        const growIndex = new Map<number, number>();
        let growAll = 0;
        let totalLength = 0;

        children.forEach(child => {
          const grow = convert.grow(child);
          if (typeof grow == 'number' && grow > 0) {
            growAll += grow;
            growIndex.set(convert.index(child), grow);
          } else {
            totalLength = totalLength + convert.outerSize(child);
          }
        });
        if (growAll > 0) {
          const remaing =
            inside.innerSize() - (gap * children.length - gap) - totalLength;
          forEach(children, child => {
            const index = convert.index(child);
            const grow = growIndex.get(index);
            const childLength = grow
              ? remaing > 0
                ? (remaing * grow) / growAll
                : 0
              : convert.outerSize(child);
            childLengths[index] = childLength;
            length = length + childLength + gap;
            list.push(length);
          });
        } else {
          const directionFix = arg.directionJustify();
          let tGap = gap;
          const allRemaing = inside.innerSize() - totalLength;
          const remaing = allRemaing - (gap * children.length - gap);

          if (directionFix == 'center') {
            list[0] = length = remaing / 2;
          } else if (directionFix == 'end') {
            list[0] = length = remaing;
          } else if (directionFix == 'around') {
            const rGap = allRemaing / children.length;
            list[0] = length = rGap / 2;
            tGap = rGap;
          } else if (directionFix == 'between') {
            if (children.length > 1) {
              const rGap = allRemaing / (children.length - 1);
              tGap = rGap;
            } else if (children.length == 1) {
              const directionFixBetweenWhenOne =
                arg.directionFixBetweenWhenOne();
              if (directionFixBetweenWhenOne == 'center') {
                list[0] = allRemaing / 2;
              } else if (directionFixBetweenWhenOne == 'end') {
                list[0] = allRemaing;
              }
            }
          } else if (directionFix == 'evenly') {
            const rGap = allRemaing / (children.length + 1);
            list[0] = length = rGap;
            tGap = rGap;
          }
          forEach(children, child => {
            const childLength = convert.outerSize(child);
            childLengths[convert.index(child)] = childLength;
            length = length + childLength + tGap;
            list.push(length);
          });
        }
      } else {
        forEach(children, child => {
          const childLength = convert.outerSize(child);
          childLengths[convert.index(child)] = childLength;
          length = length + childLength + gap;
          list.push(length);
        });
        if (length) {
          length = length - gap;
        }
      }
      list.pop();
      if (reverse) {
        list.reverse();
      }
      return {
        childLengths,
        list,
        getInsideSize,
        length,
      };
    });
  }

  cache: GetValue<{
    childLengths: number[];
    list: number[];
    getInsideSize: boolean;
    length: number;
  }>;

  sizeFromChildren(): number {
    if (this.cache().getInsideSize) {
      throw new Error('out provide a size');
    }
    return this.cache().length;
  }
  childSize(i: number): number {
    return this.cache().childLengths[i];
  }
  childPosition(i: number): number {
    return this.cache().list[i];
  }
}
