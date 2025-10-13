import { arrayFindIndexFrom, arrayMove } from '../ArrayHelper';
import { arrayReduceRight } from '../equal';
import { Box, Point, PointKey, boxEqual, pointZero } from '../geometry';
import { EmptyFun, ReadArray } from '../util';
import { reorderCheckTarget } from './util';

export interface ReorderFixHeightItemData<K> {
  index: number;
  value: K;
  child: ReorderFixHeightChild<K>;
}

type MoveV<K> = {
  lastValue: Point;
  currentItem: ReorderFixHeightChild<K>;
  onFinish(): void;
};

function sortIndex<K>(
  a: ReorderFixHeightItemData<K>,
  b: ReorderFixHeightItemData<K>
) {
  return a.index - b.index;
}

function rangeBetween(
  idx: number,
  idx1: number,
  callback: (i: number) => void
) {
  if (idx < idx1) {
    for (let i = idx; i < idx1; i++) {
      callback(i);
    }
  } else {
    for (let i = idx; i > idx1; i--) {
      callback(i);
    }
  }
}
export class ReorderFixHeight<K> {
  checkToMove(key: K, offset: Point, diff: Point) {
    const index = this.layoutList.findIndex(v => v.value == key);
    const item = reorderCheckTarget(
      this.layoutList,
      index,
      this.getHeight,
      offset[this.direction],
      this.gap
    );
    if (item) {
      const [index, targetIndex] = item;
      const targetKey = this.layoutList[targetIndex].value;
      if (this.endToMove) {
        if (this.moveFlag) {
          if (this.moveFlag.fromKey != key) {
            console.warn('不是从上一次的地方开始', this.moveFlag.toKey, key);
          }
          this.moveFlag.toKey = targetKey;
        } else {
          this.moveFlag = {
            fromKey: key,
            toKey: targetKey,
          };
        }
      } else {
        this.moveItem(key, targetKey);
      }
      arrayMove(this.layoutList, index, targetIndex);
      const diffHeight = (this.height + this.gap) * (targetIndex - index);
      this.layoutList[targetIndex].child.moveChange(diffHeight);
      rangeBetween(index, targetIndex, i => {
        const child = this.layoutList[i].child;
        child.layoutChange(-diffHeight);
      });
      return true;
    }
  }
  private moveFlag?: {
    fromKey: K;
    toKey: K;
  };
  constructor(
    private moveItem: (itemKey: K, baseKey: K) => void,
    private direction: PointKey = 'y',
    private height = 0,
    private gap = 0
  ) {
    this.setMoveDiff = this.setMoveDiff.bind(this);
    this.getHeight = this.getHeight.bind(this);
  }
  private layoutList: ReorderFixHeightItemData<K>[] = [];
  private endToMove = false;
  private getHeight() {
    return this.height;
  }
  /**每次进来更新 */
  updateLayoutList<T>(
    moveItem: (itemKey: K, baseKey: K) => void,
    direction: PointKey,
    list: ReadArray<T>,
    getKey: (v: T) => K,
    height: number,
    endToMove = false,
    gap = 0
  ) {
    this.moveItem = moveItem;
    this.height = height;
    this.gap = gap;
    arrayReduceRight(this.layoutList, (row, i) => {
      const idx = arrayFindIndexFrom(list, 0, v => getKey(v) == row.value);
      if (idx < 0) {
        this.layoutList.splice(i, 1);
      } else {
        row.index = idx;
      }
    });
    for (let i = 0; i < list.length; i++) {
      const key = getKey(list[i]);
      if (!this.layoutList.find(v => v.value == key)) {
        this.layoutList.push({
          index: i,
          value: key,
          child: undefined as any,
        });
      }
    }
    if (this.moveV) {
      if (!this.layoutList.find(v => v.value == this.moveV?.currentItem.key)) {
        this.moveV = undefined;
      }
    }
    if (this.direction != direction) {
      this.direction = direction;
      this.end(pointZero);
    }
    if (this.endToMove != endToMove) {
      this.endToMove = endToMove;
      this.end(pointZero);
    }
    this.layoutList.sort(sortIndex);
  }
  getCurrent() {
    return this.moveV?.currentItem;
  }
  /**注册 */
  registerItem(value: K, child: ReorderFixHeightChild<K>) {
    //依赖于requestAnimationFrame等去获得实时坐标,并不能完全对等
    const order = this.layoutList;
    const idx = order.findIndex(entry => value === entry.value);
    if (idx !== -1) {
      const ox = order[idx];
      ox.child = child;
    } else {
      order.push({
        index: 0,
        value,
        child,
      });
    }
  }
  private moveV: MoveV<K> | undefined = undefined;
  setMoveV(v: MoveV<K>) {
    this.moveV = v;
  }
  setMoveDiff(v: Point) {
    this.moveV?.currentItem.setMoveDiff(v);
    return true;
  }
  private didMove(mv: MoveV<K>, loc: Point) {
    mv.currentItem.setMoveDiff({
      x: loc.x - mv.lastValue.x,
      y: loc.y - mv.lastValue.y,
    });
  }
  move(loc: Point) {
    const mv = this.moveV;
    if (mv) {
      this.didMove(mv, loc);
      mv.lastValue = loc;
      return true;
    }
  }
  end(loc?: Point) {
    const mv = this.moveV;
    if (mv) {
      if (loc) {
        this.didMove(mv, loc);
      }
      this.moveV = undefined;
      mv.onFinish();
      if (this.endToMove) {
        if (this.moveFlag) {
          if (this.moveFlag.fromKey != this.moveFlag.toKey) {
            this.moveItem(this.moveFlag.fromKey, this.moveFlag.toKey);
          } else {
            console.log('不需要移动');
          }
          this.moveFlag = undefined;
        } else {
          console.log('没有任何移动');
        }
      }
      return true;
    }
  }
}

/**
 * 在真实变化之前,自定义一个偏移量
 * 但如果布局变化,这个偏移量要重新计算...
 * 如果高度还变化,其实是很难的...
 */
export class ReorderFixHeightChild<K> {
  constructor(
    private parent: ReorderFixHeight<K>,
    public readonly key: any,
    private getTrans: () => Point,
    private changeTo: (value: Point) => void,
    private layoutFrom: (n: number) => void,
    private getOffset: () => number,
    private setOffset: (n: number) => void
  ) {
    parent.registerItem(key, this);
  }
  layoutChange(n: number) {
    this.setOffset(this.getOffset() + n);
    this.layoutFrom(-n);
  }
  /**
   * 因为移动导致变化
   * @param n
   */
  moveChange(n: number) {
    const p = this.getTrans();
    this.setOffset(this.getOffset() + n);
    this.changeTo({
      x: p.x,
      y: p.y - n,
    });
  }
  setMoveDiff(diff: Point) {
    const trans = this.getTrans();
    const offset = {
      x: trans.x + diff.x,
      y: trans.y + diff.y,
    };
    this.changeTo(offset);
    this.parent.checkToMove(this.key, offset, diff);
  }
  start(loc: Point, onFinish: EmptyFun) {
    this.parent.setMoveV({
      lastValue: loc,
      currentItem: this,
      onFinish,
    });
  }
}
