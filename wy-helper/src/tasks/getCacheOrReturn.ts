import { debounceTask } from './debounce';

/**
 * 是防抖任务，且如果上一次失败，下次再重新请求
 * @param get
 * @returns
 */
export function getCacheOrRetry<T>(get: () => Promise<T>) {
  let lastValue: T;
  let lastSuccess = false;
  const debounce = debounceTask(get);
  return async function (): Promise<T> {
    if (lastSuccess) {
      return lastValue!;
    }
    const out = debounce();
    out.then(v => {
      lastSuccess = true;
      lastValue = v;
    });
    return out;
  };
}
