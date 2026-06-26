import { getGlobalThis } from '../getGlobalThis';
import { GetValue, ReduceState, SetValue } from '../setStateHelper';
import { FalseType, Flatten, emptyFun, run } from '../util';

export type PromiseResult<T> =
  | {
      type: 'success';
      promise: Promise<T>;
      value: T;
    }
  | {
      type: 'error';
      promise: Promise<T>;
      value: any;
    };

export type AbortPromiseResult<T> = PromiseResult<T> & {
  request: GetValue<Promise<T>>;
};

export type RequestAbortPromiseFinally<T> = SetValue<AbortPromiseResult<T>>;

export type PromiseResultSuccessValue<T> = T extends {
  type: 'success';
  value: infer V;
}
  ? V
  : never;
export type GetPromiseRequest<T> = () => Promise<T>;

export type VersionPromiseResult<T> = Flatten<
  AbortPromiseResult<T> & {
    version: number;
  }
>;

export type RequestVersionPromiseFinally<T> = SetValue<VersionPromiseResult<T>>;

const w = getGlobalThis() as {
  __abort_signal__?: AbortSignal;
};

export type ErrorCallback<T extends any[]> = (...vs: T) => void;

export function hookAbortCalback<T extends any[]>(
  signal: AbortSignal,
  fun: (callback: ErrorCallback<T>) => void,
  callback: ErrorCallback<T>
) {
  w.__abort_signal__ = signal;
  fun(function () {
    if (signal.aborted) {
      return;
    }
    callback.apply(null, arguments as any);
  });
  w.__abort_signal__ = undefined;
}
export function hookAbortSignalPromise<T>(
  signal: AbortSignal,
  fun: GetValue<Promise<T>>,
  callback: RequestAbortPromiseFinally<T>
) {
  w.__abort_signal__ = signal;
  const p = fun();
  w.__abort_signal__ = undefined;
  p.then(
    v => {
      if (signal.aborted) {
        return;
      }
      callback({
        type: 'success',
        promise: p,
        request: fun,
        value: v,
      });
    },
    err => {
      if (signal.aborted) {
        return;
      }
      callback({
        type: 'error',
        promise: p,
        request: fun,
        value: err,
      });
    }
  );
}
export function hookGetAbortSignal() {
  return w.__abort_signal__;
}
export type OnVersionPromiseFinally<T> = (
  data: VersionPromiseResult<T>,
  ...vs: any[]
) => void;

export type OutPromiseOrFalse<T> = GetPromiseRequest<T> | FalseType;
/**
 * 串行请求,跳过中间的请求
 * @param callback 执行体
 * @param effect 执行完成后回调
 * @param cacheList 缓存请求参数
 * @param delay 如何延迟下一场请求
 * @returns
 */
export function buildSerialRequestSingle<Req extends any[], Res>(
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>, req: Req) => void = emptyFun,
  cacheList: Req[] = [],
  delay = run
) {
  function checkRun() {
    cacheList.shift();
    if (cacheList.length) {
      //如果有值,继续操作
      circleRun();
      return false;
    }
    return true;
  }
  function didCircleRun() {
    while (cacheList.length > 1) {
      cacheList.shift();
    }
    const req = cacheList[0];
    const promise = callback(...req);
    promise
      .then(res => {
        if (checkRun()) {
          effect(
            {
              type: 'success',
              promise,
              value: res,
            },
            req
          );
        }
      })
      .catch(err => {
        if (checkRun()) {
          effect(
            {
              type: 'error',
              promise,
              value: err,
            },
            req
          );
        }
      });
  }
  function circleRun() {
    delay(didCircleRun);
  }
  return function (...vs: Req) {
    cacheList.push(vs);
    if (cacheList.length == 1) {
      //之前是空的
      circleRun();
      return true;
    }
    return false;
  };
}

/**
 * @param didRun
 * @param callback
 * @returns
 */
export function buildThrottle<VS extends any[], This = any, Z = void>(
  //触发器，这里如果trigger里再触发，可以死循环。hasCall提前置为false
  //如果trigger是promise呢，callback里面本身可能有触发，如果此时hasCall为false，则下次执行，否则，不会生效
  trigger: (callback: () => Z) => void,
  //真实的调用
  callbak: (this: This, ...vs: VS) => Z
): (this: This, ...vs: VS) => void {
  let hasCall = false;
  let it: This;
  let args: IArguments;
  return function (this: This) {
    it = this;
    args = arguments;
    if (hasCall) {
      return;
    }
    hasCall = true;
    trigger(function () {
      hasCall = false;
      return callbak.apply(it, args as any);
    });
  };
}

/**
 * 这个只是节流，最终参数状态进不去
 *  如果参数无关，在callback中，真实执行在最后是防抖，在前面是节流
 *  真实执行如果是异步的，是否阻塞？不能阻塞，否则无法防抖。
 *  希望有真实事件不并行，则需要timeOut的Promise+事件本身的promise作为结果
 * @param callbak
 * @returns
 */
export function buildThrottlePromise<VS extends any[], This = any, Z = any>(
  //真实的调用
  callbak: (this: This, ...vs: VS) => Promise<Z>,
  /**通过结合lastPromise，可以是allSettled，也可以是串联的then */
  delay: (lastPromise?: Promise<any>) => Promise<any>
): (this: This, ...vs: VS) => void | Promise<Z> {
  let hasCall = false;
  let it: This;
  let args: IArguments;
  let lastPromise: Promise<any>;
  return function (this: This) {
    it = this;
    args = arguments;
    if (hasCall) {
      return;
    }
    hasCall = true;
    delay(lastPromise).finally(() => {
      hasCall = false;
      lastPromise = callbak.apply(it, args as any);
    });
  };
}

export function buildPromiseResultSetData<F extends PromiseResult<any>>(
  updateData: ReduceState<F | undefined>
): ReduceState<PromiseResultSuccessValue<F>> {
  return function setData(fun) {
    updateData(old => {
      if (old?.type == 'success') {
        return {
          ...old,
          value: typeof fun == 'function' ? (fun as any)(old.value) : fun,
        };
      }
      return old;
    });
  };
}
