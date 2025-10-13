import { DelayCall, EmptyFun, Quote, run } from '../util';

const observerCenter = {
  on: false,
  version: 0,
  set: new Set<ObserverCellImpl<any, any>>(),
  delayCallList: [] as EmptyFun[],
};
interface ObserverCell<M> {
  get(): M;
  destroy(): void;
}
class ObserverCellImpl<
  M,
  T extends {
    value: M;
  },
> implements ObserverCell<M>
{
  constructor(
    private reducer: Quote<T>,
    private data: T
  ) {
    observerCenter.set.add(this);
  }
  private dataVersion = observerCenter.version;

  private onCalculate = false;
  get() {
    if (this.dataVersion != observerCenter.version) {
      if (this.onCalculate) {
        throw new Error('出现循环引用计算');
      }
      this.onCalculate = true;
      this.data = this.reducer(this.data);
      this.onCalculate = false;
    }
    return this.data.value;
  }
  destroy() {
    observerCenter.set.delete(this);
  }
}
export function createCell<
  M,
  T extends {
    value: M;
  },
>(reducer: Quote<T>, init: T) {
  return new ObserverCellImpl(reducer, init);
}
export async function refresh(delay?: DelayCall) {
  if (delay) {
    observerCenter.delayCallList.push(delay(delayCall));
  } else {
    delayCall();
  }
}

function delayCall() {
  if (observerCenter.on) {
    throw new Error('运行期间不允许执行');
  }
  observerCenter.on = true;
  //得到一处通知,立即清理
  observerCenter.delayCallList.forEach(run);
  observerCenter.delayCallList.length = 0;

  observerCenter.version = observerCenter.version + 1;
  for (const row of observerCenter.set) {
    row.get();
  }

  observerCenter.on = false;
}
