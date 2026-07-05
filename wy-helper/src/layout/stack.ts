import { GetValue } from '../setStateHelper';
import { memo, ValueOrGet, valueOrGetToGet } from '../signal';
import { Layout, LayoutInsideObject } from './layout';

export type AlignSelfFun = {
  position(pWidth: number, getSelfWidth: GetValue<number>): number;
  size(pWidth: number): number;
};
export interface StackChildConvert<T> {
  align(n: T): AlignSelfFun;
  outerSize(n: T): number;
}

export type AlignItem = 'center' | 'start' | 'end' | 'stretch';

export function alignSelf(getAlign: ValueOrGet<AlignItem>): AlignSelfFun {
  const gAlign = valueOrGetToGet(getAlign);
  return {
    position(pWidth, getSelfWidth) {
      const align = gAlign();
      if (align == 'center') {
        return (pWidth - getSelfWidth()) / 2;
      } else if (align == 'end') {
        return pWidth - getSelfWidth();
      } else {
        return 0;
      }
    },
    size(pWidth) {
      const align = gAlign();
      if (align == 'stretch') {
        return pWidth;
      }
      throw 'you should make your own size';
    },
  };
}

export class StackLayout<T> implements Layout {
  constructor(
    private arg: {
      alignItem(): AlignItem;
    },
    private inside: LayoutInsideObject<T>,
    private convert: StackChildConvert<T>
  ) {
    this.size = memo(function () {
      var insideSize = 0;
      var getInsideSize = true;
      try {
        insideSize = inside.innerSize();
      } catch (err) {
        getInsideSize = false;
      }
      if (getInsideSize) {
        return insideSize;
      }
      let width = 0;
      inside.children().forEach(it => {
        if (convert.align(it)) {
          return;
        }
        width = Math.max(width, convert.outerSize(it));
      });
      return width;
    });
  }

  private size: GetValue<number>;

  private child(index: number, isSize: boolean) {
    const children = this.inside.children();
    const child = children[index];
    const align = this.convert.align(child);
    if (align) {
      if (isSize) {
        return align.size(this.size());
      }
      return align.position(this.size(), () => this.convert.outerSize(child));
    }
    const alignItem = this.arg.alignItem();
    if (alignItem == 'stretch') {
      if (isSize) {
        return this.size();
      }
      return 0;
    }
    if (isSize) {
      throw new Error(`child should have it's own size`);
    }
    if (alignItem == 'start') {
      return 0;
    }
    if (alignItem == 'center') {
      return (this.size() - this.convert.outerSize(child)) / 2;
    }
    if (alignItem == 'end') {
      return this.size() - this.convert.outerSize(child);
    }
    throw new Error(`never reach`);
  }

  sizeFromChildren(): number {
    return this.size();
  }
  childSize(i: number): number {
    return this.child(i, true);
  }
  childPosition(i: number): number {
    return this.child(i, false);
  }
}
