import { GetValue } from '../setStateHelper';
import { emptyFun, EmptyFun } from '../util';
import { beginCurrentBatch, signalCache } from './global';
import { MemoGet } from './memo';

export interface TrackSignalSet<T> {
  (v: T, oldV: undefined, inited: false): void | EmptyFun;
  (v: T, oldV: T, inited: true): void | EmptyFun;
}

export class TrackSignal<T> {
  private disabled = false;

  private inited = false;
  private lastValue: any = undefined;

  private destroy = emptyFun;
  constructor(
    private get: MemoGet<T>,
    private set: TrackSignalSet<T>
  ) {
    const deps = signalCache.onWorkBatch?.deps;
    if (deps) {
      deps.push(this);
    } else {
      //没在执行中
      beginCurrentBatch();
      signalCache.currentBatch.deps.push(this);
    }
  }
  addFun() {
    if (this.disabled) {
      return;
    }

    signalCache.currentFun = this;
    const value = this.get(this.lastValue, this.inited as true);
    signalCache.currentFun = undefined;

    if (this.inited) {
      if (value != this.lastValue) {
        this.destroy();
        this.destroy = this.set(value, this.lastValue, this.inited) || emptyFun;
        this.lastValue = value;
      }
    } else {
      this.destroy = this.set(value, this.lastValue, this.inited) || emptyFun;
      this.lastValue = value;
      this.inited = true;
    }
  }
  dispose() {
    //销毁
    this.destroy();
    this.disabled = true;
  }
}
/**
 * 跟踪信号
 * 这里get函数是常执行的,set函数会在必要时执行,跟memo的结果一样
 * 是否可以合并只有一个函数,则始终是memo的.毕竟现在set里,也不能设置状态了
 * 而且由于是终节点,get在批量时,每次只执行一次
 * @param get 通过信号计算出来的值
 * @returns 同步事件
 */
export function trackSignal<T>(
  get: MemoGet<T>,
  set: TrackSignalSet<T> = emptyFun
): EmptyFun {
  const t = new TrackSignal(get, set);
  return t.dispose.bind(t);
}

/**
 * 希望支持如mobx
 * @param callback 信号变化,通知更新
 * @returns
 */
export function collectSignal(callback: EmptyFun) {
  const t = new TrackSignal(callback, emptyFun);
  return {
    destroy: t.dispose.bind(t),
    /**
     * 如收集react的render
     * 这里其实就会涉及反复render,注入链表很长
     * @param fun
     * @returns
     */
    collect<T>(fun: GetValue<T>) {
      signalCache.currentFun = t;
      // signalCache.currentFunRemove = remove;
      const value = fun();
      signalCache.currentFun = undefined;
      // signalCache.currentFunRemove = false;
      return value;
    },
  };
}
