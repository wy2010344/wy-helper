import {
  applySetStateAction,
  SetStateAction,
  SetValue,
} from './setStateHelper';
import { EmptyFun, alawaysTrue, emptyFun, quote, run } from './util';

export interface SyncFun<T> {
  (set: SetValue<T>): EmptyFun;
  <A>(set: (t: T, a: A) => void, a: A): EmptyFun;
  <A, B>(set: (t: T, a: A, b: B) => void, a: A, b: B): EmptyFun;
  <A, B, C>(set: (t: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): EmptyFun;
}
/**
 * 还是使用signal吧
 */
type EventHandler<T> = (v: T) => void;
type EventChangeHandler<T> = (v: T, old: T) => void;
export interface VirtualEventCenter<T> {
  subscribe(notify: EventChangeHandler<T>): EmptyFun;
}
export class EventCenter<T> {
  private pool = new Set<EventChangeHandler<T>>();
  poolSize() {
    return this.pool.size;
  }
  subscribe(notify: EventChangeHandler<T>): EmptyFun {
    if (this.pool.has(notify)) {
      return emptyFun;
    }
    this.pool.add(notify);
    const that = this;
    return function () {
      that.pool.delete(notify);
    };
  }
  notify(v: T, oldV: T) {
    this.pool.forEach(notify => notify(v, oldV));
  }
}
export function toReduceState<T>(set: (v: T) => void, get: () => T) {
  return function (v: SetStateAction<T>) {
    set(applySetStateAction(v, get()));
  };
}

export interface ReadValueCenter<T> extends VirtualEventCenter<T> {
  get(): T;
}
export interface ValueCenter<T> extends ReadValueCenter<T> {
  set(v: T): void;
}

const __sync__ = '__SYNC__';
export function getCenterSync<T>(v: ReadValueCenter<T>) {
  const vx = v as any;
  if (!vx[__sync__]) {
    vx[__sync__] = function () {
      const [set, a, b, c] = arguments;
      set(v.get(), a, b, c);
      return v.subscribe(n => {
        set(n, a, b, c);
      });
    };
  }
  return vx[__sync__] as SyncFun<T>;
}

export class ReadValueCenterProxyImpl<T> implements ReadValueCenter<T> {
  constructor(private center: ValueCenter<T>) {}
  get(): T {
    return this.center.get();
  }
  subscribe(ev: EventChangeHandler<T>) {
    return this.center.subscribe(ev);
  }
}
export class ValueCenterDefaultImpl<T> implements ValueCenter<T> {
  constructor(private value: T) {}
  private ec = new EventCenter<T>();
  set(v: T): void {
    const oldValue = this.value;
    this.value = v;
    this.ec.notify(v, oldValue);
  }
  poolSize(): number {
    return this.ec.poolSize();
  }
  get(): T {
    return this.value;
  }
  subscribe(ev: EventChangeHandler<T>) {
    return this.ec.subscribe(ev);
  }

  private rv: ReadValueCenter<T> | undefined = undefined;
  readonly() {
    if (!this.rv) {
      this.rv = new ReadValueCenterProxyImpl(this);
    }
    return this.rv;
  }
}

export function valueCenterOf<T>(value: T) {
  return new ValueCenterDefaultImpl(value);
}
export function syncMergeCenter<T>(c: ReadValueCenter<T>, cb: EventHandler<T>) {
  cb(c.get());
  return c.subscribe(cb);
}

// 定义将元素类型映射成另一种类型的映射函数
type MapTo<T> = { [K in keyof T]: ValueCenter<T[K]> };

// type ExtractValues<T> = {
//   -readonly [K in keyof T]: T[K] extends ReadValueCenter<infer U> ? U : never;
// }
export type BuildValueCenters<T> = {
  readonly [K in keyof T]: ReadValueCenter<T[K]>;
};
function baseCenterArray<VS extends readonly any[]>(
  vs: any,
  list: BuildValueCenters<VS>,
  cb: EventHandler<VS>,
  delay = run
) {
  function callback() {
    cb(vs);
  }
  const destroys = list.map((row, i) => {
    vs[i] = row.get();
    return row.subscribe(function (c) {
      vs[i] = c;
      delay(callback);
    });
  });
  return function () {
    destroys.forEach(run);
  };
}
export function subscribeCenterArray<VS extends readonly any[]>(
  list: BuildValueCenters<VS>,
  cb: EventHandler<VS>,
  delay = run
) {
  const vs = [] as any;
  return baseCenterArray(vs, list, cb, delay);
}

export function syncMergeCenterArray<VS extends readonly any[]>(
  list: BuildValueCenters<VS>,
  cb: EventHandler<VS>,
  delay = run
) {
  const vs = [] as unknown as any;
  const destroy = baseCenterArray(vs, list, cb, delay);
  cb(vs);
  return destroy;
}
/**
 * 事实上可以用于多种状态机
 * @param reducer
 * @param init
 * @returns
 */
export function createReduceValueCenter<T, A>(
  reducer: ReducerWithDispatch<T, A>,
  init: T,
  shouldChange: (a: T, b: T) => any = alawaysTrue
) {
  const center = valueCenterOf(init);
  const taskList: A[] = [];
  function set(action: A) {
    taskList.push(action);
    if (taskList.length == 1) {
      while (taskList.length) {
        const task = taskList.pop()!;
        const oldValue = center.get();
        const [newValue, act] = reducer(oldValue, task);
        if (shouldChange(newValue, oldValue)) {
          center.set(newValue);
        }
        act?.(set);
      }
    }
  }
  return [center.readonly(), set] as const;
}

export function subscribeOnce<T>(
  v: ReadValueCenter<T>,
  fun: EventChangeHandler<T>
) {
  const callback: EventChangeHandler<T> = (v, old) => {
    fun(v, old);
    destroy();
  };
  const destroy = v.subscribe(callback);
}

export type Reducer<T, A> = (v: T, a: A) => T;
export type ReducerWithDispatch<T, A> = (
  v: T,
  a: A
) => ReducerWithDispatchResult<T, A>;
export type ReducerDispatch<A> = SetValue<SetValue<A>> | undefined;
export type ReducerWithDispatchResult<T, A> = [T, ReducerDispatch<A>] | [T];

export function mapReducerDispatch<A, B>(
  act: ReducerDispatch<A>,
  map: (a: A) => B
): ReducerDispatch<B> {
  if (act) {
    return function (dispatch) {
      act(function (value) {
        dispatch(map(value));
      });
    };
  }
}

export function mapReducerDispatchList<A, B>(
  acts: ReducerDispatch<A>[],
  map: (a: A) => B
): ReducerDispatch<B> {
  if (acts.length && acts.some(quote)) {
    return function (dispatch) {
      acts.forEach(function (act) {
        if (act) {
          act(function (value) {
            dispatch(map(value));
          });
        }
      });
    };
  }
}
export function mapReducerDispatchListA<A, B, D>(
  data: A[],
  getDispatch: (v: A) => ReducerDispatch<D>,
  map: (d: D, a: A) => B
): ReducerDispatch<B> {
  if (data.length) {
    return function (dispatch) {
      data.forEach(function (row) {
        const act = getDispatch(row);
        if (act) {
          act(function (value) {
            dispatch(map(value, row));
          });
        }
      });
    };
  }
}
