import {
  AbortPromiseResult,
  hookAbortSignalPromise,
} from '../promise/buildSerialRequestSingle';
import { getOutResolvePromise } from '../setStateHelper';

/**
 * 防抖任务
 * 有新任务时，旧任务尽量取消
 */
export function debounceTask<T extends (...vs: any[]) => Promise<any>>(
  action: T,
  didCall?: (n: AbortPromiseResult<Awaited<ReturnType<T>>>) => void
) {
  let lastAbortController: AbortController | undefined = undefined;
  let lastSuccessTask:
    | {
        promise: Promise<any>;
        resolve(v: any): void;
        reject(v: any): void;
      }
    | undefined = undefined;
  return function (...vs) {
    lastAbortController?.abort();
    lastAbortController = new AbortController();
    hookAbortSignalPromise(
      lastAbortController.signal,
      () => action(...vs),
      function (out) {
        if (out.type == 'success') {
          lastSuccessTask!.resolve(out.value);
        } else {
          lastSuccessTask!.reject(out.value);
        }
        lastSuccessTask = undefined;
        didCall?.(out);
      }
    );

    if (lastSuccessTask) {
      return lastSuccessTask.promise;
    }
    const [promise, resolve, reject] = getOutResolvePromise();
    lastSuccessTask = {
      promise,
      resolve,
      reject,
    };
    return promise;
  } as T;
}
