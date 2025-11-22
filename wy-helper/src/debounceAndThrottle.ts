/**
 * 如果首次立即执行，则是执行时禁用，定时打开
 * 如果是始终延迟执行，则是延时
 * https://juejin.cn/post/7100920925259825188
 */

import { emptyFun, EmptyFun } from './util';

/**
 * 版本一，始终延迟
 * @param func
 * @param delay
 * @returns
 */
export function debounce<This, T extends readonly any[], Z = any>(
  func: (this: This, ...vs: T) => Z,
  /**
   * 返回清理函数,如定时任务的清理函数
   */
  callback: (fun: EmptyFun) => EmptyFun
): (this: This, ...vs: T) => void {
  let it: This;
  let args: IArguments;
  let clear = emptyFun;
  return function (this: This) {
    it = this;
    args = arguments;
    //如果中间有触发，始终延迟
    clear();
    clear = callback(() => {
      //要使用最新的参数
      func.apply(it, args as any);
    });
  };
}

/**
 * 首次执行
 * @param func
 * @param callback
 * @returns
 */
export function debounceEager<This, T extends readonly any[], Z = any>(
  func: (this: This, ...vs: T) => Z,
  /**
   * 返回清理函数,如定时任务的清理函数
   */
  callback: (fun: EmptyFun) => EmptyFun
): (this: This, ...vs: T) => void {
  let it: This;
  let args: IArguments;
  let clear: EmptyFun | undefined = undefined;
  return function (this: This) {
    it = this;
    args = arguments;
    if (clear) {
      clear();
    } else {
      //初次执行
      func.apply(this, arguments as any);
    }
    clear = callback(() => {
      clear = undefined;
    });
  };
}

/**
 * 只与周期相关
 * @param func
 * @param callback
 * @returns
 */
export function throttle<This, T extends readonly any[], Z = any>(
  func: (this: This, ...vs: T) => Z,
  /**
   * 比如使用requestAnimateFrame
   * 使用setTimeout
   */
  callback: (fun: () => void) => void
): (this: This, ...vs: T) => void {
  let inThrottle = false;
  return function (this: This) {
    if (inThrottle) {
      return;
    }
    inThrottle = true;
    func.apply(this, arguments as any);
    callback(() => {
      inThrottle = false;
    });
  };
}

export function throttleLimit<This, T extends readonly any[], Z = any>(
  func: (this: This, ...vs: T) => Z,
  limit: number
): (this: This, ...vs: T) => void {
  let previous = 0;
  return function (this: This) {
    let now = Date.now();
    if (now - previous > limit) {
      previous = limit;
      func.apply(this, arguments as any);
    }
  };
}
