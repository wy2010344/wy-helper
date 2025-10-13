import { Compare } from '../equal';
import { GetValue } from '../setStateHelper';
import { createSignal, memo, trackSignal } from '../signal';
import { FalseType, Quote } from '../util';
import {
  AbortPromiseResult,
  hookAbortCalback,
  hookAbortSignalPromise,
} from './buildSerialRequestSingle';
import { AutoLoadMoreCore } from './stopCall';

export function signalSerialAbortPromise<T>(
  generatePromise: GetValue<GetValue<Promise<T>> | FalseType>
) {
  const signal = createSignal<AbortPromiseResult<T> | undefined>(undefined);
  const memoGeneratePromise = memo(generatePromise);
  const destroy = trackSignal(memoGeneratePromise, function (getPromise) {
    if (getPromise) {
      const abort = new AbortController();
      hookAbortSignalPromise(abort.signal, getPromise, signal.set);
      return function () {
        abort.abort();
      };
    }
  });

  //状态值
  function get() {
    if (memoGeneratePromise()) {
      return signal.get();
    }
    return undefined;
  }

  //如果是成功状态,更新值
  function reduceSet(callback: Quote<T>) {
    const value = get();
    if (value?.type == 'success') {
      signal.set({
        ...value,
        value: callback(value.value),
      });
    }
  }

  //是否正在加载中
  function loading() {
    const request = memoGeneratePromise();
    if (request) {
      //是否正在加载中
      return request != signal.get()?.request;
    }
    return false;
  }
  return {
    destroy,
    get,
    reduceSet,
    loading,
  };
}

export type MultiAbortPromiseResult<T> = AbortPromiseResult<T> & {
  finish?: boolean;
};

type OnUpdate<T> = {
  (
    type: 'success',
    get: GetValue<Promise<T>>,
    p: Promise<T>,
    data: T,
    finish?: boolean
  ): void;
  (type: 'error', get: GetValue<Promise<T>>, p: Promise<T>, v: any): void;
};
function fetchWithCacheFallback<T>(
  list: GetValue<Promise<T>>[],
  onUpdate: OnUpdate<T>
): void {
  let resolve = -1;
  const lastIdx = list.length - 1;
  list.forEach((row, i) => {
    const p = row();
    p.then(data => {
      if (i == lastIdx) {
        onUpdate('success', row, p, data, true);
      } else if (resolve < i) {
        onUpdate('success', row, p, data);
      }
      resolve = i;
    }).catch(err => {
      if (i == lastIdx) {
        onUpdate('error', row, p, err);
      }
    });
  });
}
export function signalMultiAbortCallback<T>(
  generatePromise: GetValue<GetValue<Promise<T>>[] | FalseType>
) {
  const signal = createSignal<MultiAbortPromiseResult<T> | undefined>(
    undefined
  );
  const memoGeneratePromise = memo(generatePromise);
  const destroy = trackSignal(memoGeneratePromise, function (getPromise) {
    if (getPromise) {
      const abort = new AbortController();
      hookAbortCalback(
        abort.signal,
        callback => {
          fetchWithCacheFallback(getPromise, callback);
        },
        function (type, request, promise, value, finish?: boolean) {
          const o = {
            type,
            promise,
            request,
            value,
            finish,
          };
          signal.set(o);
        }
      );
      return function () {
        abort.abort();
      };
    }
  });
  //状态值
  function get() {
    if (memoGeneratePromise()) {
      return signal.get();
    }
    return undefined;
  }
  //如果是成功状态,更新值
  function reduceSet(callback: Quote<T>) {
    const value = get();
    if (value?.type == 'success') {
      signal.set({
        ...value,
        value: callback(value.value),
      });
    }
  }

  return {
    get,
    reduceSet,
    destroy,
  };
}

export function signalSerialAbortPromiseLoadMore<T, K, M = {}>(
  generateReload: GetValue<
    | {
        getAfter(k: K): Promise<AutoLoadMoreCore<T, K> & M>;
        first: K;
      }
    | FalseType
  >,
  equals?: Compare<T>
) {
  const memoGenerateReload = memo(generateReload);
  const getPromise = memo(() => {
    const reload = memoGenerateReload();
    if (reload) {
      return function () {
        return reload.getAfter(reload.first);
      };
    }
  });
  const d = signalSerialAbortPromise(getPromise);
  const loadingMore = createSignal(false);
  const lastloadMoreError = createSignal<any>(undefined);
  return {
    ...d,
    loadingMore: loadingMore.get,
    lastLoadMoreError: lastloadMoreError.get,
    /**loadMore是阻塞的*/
    loadMore() {
      if (d.loading()) {
        //重新加载中,不行
        return false;
      }
      if (loadingMore.get()) {
        return false;
      }
      const data = d.get();
      if (data?.type != 'success') {
        return false;
      }
      if (!data.value.hasMore) {
        return false;
      }
      const reload = memoGenerateReload();
      if (!reload) {
        return false;
      }
      loadingMore.set(true);
      reload
        .getAfter(data.value.nextKey)
        .then(value => {
          d.reduceSet(oldValue => {
            let newList = oldValue.list;
            if (equals) {
              newList = [...oldValue.list];
              value.list.forEach(row => {
                const idx = newList.findIndex(x => equals(row, x));
                if (idx < 0) {
                  newList.push(row);
                } else {
                  newList.splice(idx, 1, row);
                }
              });
            } else {
              newList = newList.concat(value.list);
            }
            return {
              ...value,
              list: newList,
            };
          });
          lastloadMoreError.set(undefined);
          loadingMore.set(false);
        })
        .catch(error => {
          lastloadMoreError.set(error);
          loadingMore.set(false);
        });
      return true;
    },
  };
}
