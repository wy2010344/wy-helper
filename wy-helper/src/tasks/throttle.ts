import { PromiseResult } from '../promise/buildSerialRequestSingle';

/***
 * 节流任务
 */
export function throttleTask<T extends (...vs: any[]) => Promise<any>>(
  action: T,
  didCall?: (n: PromiseResult<Awaited<ReturnType<T>>>) => void
) {
  let promise: Promise<any> | undefined = undefined;
  function clearLastPromise() {
    promise = undefined;
  }
  return function (...vs) {
    if (promise) {
      return promise;
    }
    promise = action(...vs);
    if (didCall) {
      promise.then(value => {
        didCall({
          type: 'success',
          value,
          promise: promise!,
        });
      });
      promise.catch(error => {
        didCall({
          type: 'error',
          value: error,
          promise: promise!,
        });
        throw error;
      });
    }
    promise.finally(clearLastPromise);
    return promise;
  } as T;
}
