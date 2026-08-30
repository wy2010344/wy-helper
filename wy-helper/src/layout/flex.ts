import { arrayReduceLeft, arrayReduceRight } from '..';
import { GetValue } from '../setStateHelper';
import { memo, ValueOrGet, valueOrGetToGet } from '../signal';
import { Layout, LayoutError, LayoutInsideObject } from './layout';

export type DirectionFixBetweenWhenOne = 'center' | 'end' | 'start';

export type DirectionJustify =
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly'
  | 'grow';

export interface FlexChildConvert<T> {
  index(n: T): number;
  grow(n: T): number;
  outerSize(n: T): number;
  ignore(n: T): boolean;
}

export class FlexLayout<T> implements Layout {
  directionJustify: GetValue<DirectionJustify>;
  constructor(
    arg: {
      reverse?: ValueOrGet<boolean>;
      gap?: ValueOrGet<number>;
      directionJustify?: ValueOrGet<DirectionJustify>;
      directionFixBetweenWhenOne?: ValueOrGet<DirectionFixBetweenWhenOne>;
    },
    private inside: LayoutInsideObject<T>,
    convert: FlexChildConvert<T>
  ) {
    const aReverse = valueOrGetToGet(arg.reverse ?? false);
    const aGap = valueOrGetToGet(arg.gap ?? 0);
    this.directionJustify = valueOrGetToGet(arg.directionJustify ?? 'grow');
    const aDirectionFixBetweenWhenOne = valueOrGetToGet(
      arg.directionFixBetweenWhenOne ?? 'center'
    );
    // 一次遍历同时得到：过滤掉 ignore 的子节点 + 是否有 grow 子节点。
    this.flexChildInfo = memo<readonly [readonly T[], boolean]>((): readonly [readonly T[], boolean] => {
      const children = inside.children().filter(x => !convert.ignore(x));
      return [children, children.some(x => convert.grow(x) > 0)];
    });
    this.cache = memo(() => {
      const reverse = aReverse();
      let length = 0;
      const list: number[] = [];
      const childLengths: number[] = [];

      const [flexChildren, hasGrowChildren] = this.flexChildInfo();
      const flexCount = flexChildren.length;

      const forEach = reverse ? arrayReduceRight : arrayReduceLeft;

      const gap = aGap();

      function place(child: T, childLength: number, childGap: number) {
        const index = convert.index(child);
        childLengths[index] = childLength;
        list[index] = length;
        length = length + childLength + childGap;
      }

      if (hasGrowChildren) {
        const insideSize = inside.innerSize();
        const growIndex = new Map<number, number>();
        let growAll = 0;
        let totalLength = 0;

        flexChildren.forEach(child => {
          const index = convert.index(child);
          const grow = convert.grow(child);
          if (grow > 0) {
            growAll += grow;
            growIndex.set(index, grow);
          } else {
            totalLength = totalLength + convert.outerSize(child);
          }
        });
        if (growAll > 0) {
          const remaing = insideSize - (gap * flexCount - gap) - totalLength;
          forEach(flexChildren, child => {
            const index = convert.index(child);
            const grow = growIndex.get(index);
            const childLength = grow
              ? remaing > 0
                ? (remaing * grow) / growAll
                : 0
              : convert.outerSize(child);
            place(child, childLength, gap);
          });
        }
      } else if (this.directionJustify() == 'grow') {
        forEach(flexChildren, child => {
          place(child, convert.outerSize(child), gap);
        });
        if (length) {
          length = length - gap;
        }
      } else {
        const directionFix = this.directionJustify();
        let tGap = gap;
        let totalLength = 0;
        flexChildren.forEach(child => {
          totalLength = totalLength + convert.outerSize(child);
        });
        const allRemaing = inside.innerSize() - totalLength;
        const remaing = allRemaing - (gap * flexCount - gap);

        if (directionFix == 'center') {
          length = remaing / 2;
        } else if (directionFix == 'end') {
          length = remaing;
        } else if (directionFix == 'around') {
          const rGap = allRemaing / flexCount;
          length = rGap / 2;
          tGap = rGap;
        } else if (directionFix == 'between') {
          if (flexCount > 1) {
            const rGap = allRemaing / (flexCount - 1);
            tGap = rGap;
          } else if (flexCount == 1) {
            const directionFixBetweenWhenOne = aDirectionFixBetweenWhenOne();
            if (directionFixBetweenWhenOne == 'center') {
              length = allRemaing / 2;
            } else if (directionFixBetweenWhenOne == 'end') {
              length = allRemaing;
            }
          }
        } else if (directionFix == 'evenly') {
          const rGap = allRemaing / (flexCount + 1);
          length = rGap;
          tGap = rGap;
        }
        forEach(flexChildren, child => {
          place(child, convert.outerSize(child), tGap);
        });
      }
      return {
        childLengths,
        list,
        length,
      };
    });
  }

  flexChildInfo: GetValue<readonly [readonly T[], boolean]>;
  cache: GetValue<{
    childLengths: number[];
    list: number[];
    length: number;
  }>;

  sizeFromChildren(): number {
    if (this.directionJustify() == 'grow' && !this.flexChildInfo()[1]) {
      return this.cache().length;
    }
    return this.inside.innerSize();
  }
  childSize(i: number): number {
    const v = this.cache().childLengths[i];
    if (v == undefined) {
      throw new LayoutError(`${i} is ignored, its size is not available in FlexLayout`);
    }
    return v;
  }
  childPosition(i: number): number {
    const v = this.cache().list[i];
    if (v == undefined) {
      throw new LayoutError(`${i} is ignored, its position is not available in FlexLayout`);
    }
    return v;
  }
  allowSizeFromChildren(): boolean {
    return this.directionJustify() == 'grow' && !this.flexChildInfo()[1];
  }
}