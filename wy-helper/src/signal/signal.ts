import { Compare, simpleNotEqual } from '../equal';
import { GetValue } from '../setStateHelper';
import { StoreRef } from '../storeRef';
import { emptyObject, Quote } from '../util';
import {
  addRelay,
  beginCurrentBatch,
  signalCache,
  updateGlobalVersion,
} from './global';
import { TrackSignal } from './trackSignal';

export interface OneSetStoreRef<T> {
  getOnlySet(): Quote<T>;
  get: GetValue<T>;
}

class Signal<T> implements OneSetStoreRef<T> {
  constructor(
    private value: T,
    public shouldChange: Compare<T>
  ) {}
  private didSet(v: T) {
    if (signalCache.onWorkBatch && this.listeners.size) {
      //如果在计算期间,且有依赖项,不能安全更新
      throw new Error('计算期间不允许修改值');
    }
    if (this.shouldChange(v, this.value)) {
      if (signalCache.callGet) {
        updateGlobalVersion(signalCache.state);
        signalCache.callGet = false;
      }
      this.value = v;
      if (this.listeners.size) {
        //有listener才通知更新
        this.listeners.forEach(addListener);
        this.listeners.clear();
        beginCurrentBatch();
      }
    }
    return v;
  }

  private listeners = new Set<TrackSignal<any>>();
  get = () => {
    const value = this.value;
    addRelay(this.get, value);
    // 在事件中也会去get!
    // if (!signalCache.onWorkBatch && this.listeners.length) {
    //   console.warn('get signal value not in observer,check if it is right');
    // }
    if (signalCache.currentFun) {
      this.listeners.add(signalCache.currentFun);
    }
    return value;
  };
  private onlySet = false;
  private setSymbolMessage: string = 'already get this set for only use';
  getOnlySet(message = this.setSymbolMessage): Quote<T> {
    if (this.onlySet) {
      throw new Error(message);
    }
    this.setSymbolMessage = message;
    this.onlySet = true;
    return this.didSet.bind(this);
  }
}

function addListener(listener: TrackSignal<any>) {
  signalCache.currentBatch.listeners.add(listener);
}

export function createLateSignal<T>(
  value: T,
  shouldChange: Compare<T> = simpleNotEqual
): OneSetStoreRef<T> {
  return new Signal(value, shouldChange);
}
/**
 * 信号
 * @param value
 * @param shouldChange
 * @returns
 */
export function createSignal<T>(
  value: T,
  shouldChange: Compare<T> = simpleNotEqual
): StoreRef<T> {
  const n = new Signal(value, shouldChange);
  const set = n.getOnlySet();
  const m = n as unknown as StoreRef<T>;
  m.set = set;
  return m;
}

export function toProxySignal<T extends {}>(
  init: T,
  {
    signalObject = {} as any,
    getToCreate,
    setToCreate,
  }: {
    signalObject?: {
      [key in keyof T]: StoreRef<T[key]>;
    };
    getToCreate?: boolean;
    setToCreate?: boolean;
  } = emptyObject
) {
  for (const key in init) {
    signalObject[key] = createSignal(init[key]);
  }
  type Target = Record<string | symbol, StoreRef<any>>;
  return new Proxy(signalObject, {
    get(target: Target, p, receiver) {
      let tp = target[p];
      if (!tp) {
        if (getToCreate) {
          tp = createSignal(undefined);
          target[p] = tp;
        } else {
          return undefined;
        }
      }
      return tp.get();
    },
    set(target, p, newValue, receiver) {
      let tp = target[p];
      if (!tp) {
        if (setToCreate) {
          tp = createSignal(newValue);
          target[p] = tp;
        } else {
          return false;
        }
      }
      tp.set(newValue);
      return true;
    },
  }) as T;
}
