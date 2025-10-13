import { removeEqual } from './equal';
import { GetValue, SetValue } from './setStateHelper';
import { createSignal, memo } from './signal';
import { StoreRef } from './storeRef';
import { emptyArray, Quote } from './util';

export function createVersion(step = 1) {
  const v = createSignal(Number.MIN_SAFE_INTEGER);

  return {
    get: v.get,
    update() {
      const n = v.get() + step;
      if (n >= Number.MAX_SAFE_INTEGER) {
        console.error('出现错误,到达最大边界');
      }
      v.set(n);
    },
  };
}

export function optimistic<T>(get: GetValue<T>) {
  const cache = createSignal<{ value: T } | undefined>(undefined);
  return {
    get() {
      const c = cache.get();
      if (c) {
        return c.value;
      }
      return get();
    },
    set(v: T) {
      cache.set({
        value: v,
      });
    },
    loading() {
      return Boolean(cache.get());
    },
    reset() {
      cache.set(undefined);
    },
  };
}

export type BatchOptimistic<T> = ReturnType<typeof batchOptimistic<T>>;

type Op<T> = {
  id: number;
  callback: Quote<T>;
};
function callbackOb<T>(init: T, row: Op<T>) {
  return row.callback(init);
}
export function batchOptimistic<T>(model: StoreRef<T>) {
  const ops = createSignal<Op<T>[]>(emptyArray);
  let uid = Number.MIN_SAFE_INTEGER;
  return {
    original: model,
    get: memo(function () {
      const vs = ops.get();
      return vs.reduce(callbackOb, model.get());
    }),
    set(callback: Quote<T>) {
      const id = uid++;
      ops.set(
        ops.get().concat({
          id,
          callback,
        })
      );
      function reset() {
        ops.set(ops.get().filter(x => x.id != id));
      }
      return {
        loading() {
          return ops.get().find(x => x.id == id);
        },
        reset,
        commit() {
          model.set(callback(model.get()));
          reset();
        },
      };
    },
    opCountInWait() {
      return ops.get().length;
    },
  };
}
