import { arrayMove } from '../ArrayHelper';
import { arrayNotEqualOrOne } from '../equal';
import { MoveIndex, rangeBetweenLeft, reorderCheckTarget } from './util';

export function buildEndToMove<T>({
  getHeight,
  gap,
  getTransValue,
  moveChange,
  layoutTo,
  endLayout = layoutTo,
}: {
  getHeight(n: T): number;
  gap: number;
  getTransValue(n: T): number;
  moveChange?(change?: MoveIndex): void;
  layoutTo(n: T, target: number): Promise<any> | void;
  endLayout?(n: T, target: number): Promise<any> | void;
}) {
  let tempOut:
    | {
        change?: MoveIndex;
        list: T[];
        promises: Promise<any>[];
      }
    | undefined = undefined;
  function didDrag(infoList: T[], idx: number) {
    const row = infoList[idx];
    const change = reorderCheckTarget(
      infoList,
      idx,
      getHeight,
      getTransValue(row),
      gap
    );
    if (tempOut && !arrayNotEqualOrOne(change, tempOut?.change)) {
      return tempOut;
    }
    const promises: Promise<any>[] = [];
    function thisLayoutTo(n: T, target: number) {
      const promise = layoutTo(n, target);
      if (promise) {
        promises.push(promise);
      }
    }
    let list: T[] = infoList;
    if (change) {
      const [idx, idx1] = change;
      list = arrayMove(infoList, idx, idx1, true);
      const diffHeight = getHeight(list[idx1]) + gap;

      if (idx < idx1) {
        for (let i = 0; i < idx; i++) {
          thisLayoutTo(list[i], 0);
        }
        for (let i = idx; i < idx1; i++) {
          thisLayoutTo(list[i], -diffHeight);
        }
        for (let i = idx1 + 1; i < list.length; i++) {
          thisLayoutTo(list[i], 0);
        }
      } else {
        for (let i = 0; i < idx1; i++) {
          thisLayoutTo(list[i], 0);
        }
        const sendIdx = idx + 1;
        for (let i = idx1 + 1; i < sendIdx; i++) {
          thisLayoutTo(list[i], diffHeight);
        }
        for (let i = sendIdx; i < list.length; i++) {
          thisLayoutTo(list[i], 0);
        }
      }
    } else {
      for (let i = 0; i < infoList.length; i++) {
        if (i != idx) {
          thisLayoutTo(list[i], 0);
        }
      }
    }
    tempOut = {
      list,
      change,
      promises,
    };
    moveChange?.(change);
    return tempOut;
  }

  function didEnd(infoList: T[], idx: number) {
    const target = didDrag(infoList, idx);
    const { change, list: targetList, promises } = target;
    function thisLayoutTo(n: T, target: number) {
      const promise = endLayout(n, target);
      if (promise) {
        promises.push(promise);
      }
    }
    if (change) {
      const [idx, idx1] = change;
      let diffHeight = 0;
      rangeBetweenLeft(idx, idx1, function (i) {
        const row = targetList[i];
        const height = getHeight(row);
        diffHeight = diffHeight + height + gap;
      });
      if (idx > idx1) {
        diffHeight = -diffHeight;
      }
      thisLayoutTo(infoList[idx], diffHeight);
    } else {
      thisLayoutTo(infoList[idx], 0);
    }

    return function (callback: (change?: MoveIndex) => void) {
      if (promises.length) {
        Promise.all(promises).then(() => {
          callback(change);
        });
      } else {
        callback(change);
      }
    };
  }

  return [didDrag, didEnd] as const;
}
