/*
 * Scroller
 * http://github.com/zynga/scroller
 *
 * Copyright 2011, Zynga Inc.
 * Licensed under the MIT License.
 * https://raw.github.com/zynga/scroller/master/MIT-LICENSE.txt
 *
 * Based on the work of: Unify Project (unify-project.org)
 * http://unify-project.org
 * Copyright 2011, Deutsche Telekom AG
 * License: MIT + Apache (V2)
 */

import { EmptyFun } from "../util";

/**
 * Generic animation class with support for dropped frames both optional easing and duration.
 *
 * Optional duration is useful when the lifetime is defined by another condition than time
 * e.g. speed of an animating object, etc.
 *
 * Dropped frame logic allows to keep using the same updater logic independent from the actual
 * rendering. This eases a lot of cases where it might be pretty complex to break down a state
 * based on the pure time difference.
 */
var time = function () {
  return performance.now()
};
var desiredFrames = 60;
var millisecondsPerSecond = 1000;
/*** 启动动画。
*
* @param stepCallback  指向每一步执行的函数的指针。
* @param verifyCallback 在每个动画步骤之前执行。
* @param completeCallback
* @param duration 运行动画的毫秒数
* @param easingMethod  指向缓和函数的指针
* @return 动画标识符。可用于随时停止动画。
  */
export function start(
  requestAnimationFrame: (cb: EmptyFun) => any,
  stepCallback: (percent: number, now: number, virtual: boolean) => boolean | void,
  verifyCallback: (finish: EmptyFun) => boolean,
  completedCallback: (droppedFrames: number, finish: EmptyFun, finished: boolean) => void,
  duration?: number,
  easingMethod?: (percent: number) => number
) {
  let stoped = false
  const start = time();
  var lastFrame = start;
  var percent = 0;
  var dropCounter = 0;
  // 这是每隔几毫秒调用一次的内部步骤方法
  const step = function (virtual?: boolean | number) {
    // Normalize virtual value
    const render = virtual !== true;
    // Get current time
    const now = time();
    // 在下一个动画步骤之前执行验证
    if (stoped || (verifyCallback && !verifyCallback(finish))) {
      stoped = true
      completedCallback?.(
        desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)),
        finish,
        false);
      return;
    }
    // 为了应用当前的渲染，让我们更新内存中省略的步骤。
    // 这对于及时更新内部状态变量非常重要。
    if (render) {
      const droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
      for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
        step(true);
        dropCounter++;
      }
    }
    // Compute percent value
    if (duration) {
      percent = (now - start) / duration;
      if (percent > 1) {
        percent = 1;
      }
    }
    // Execute step callback, then...
    var value = easingMethod ? easingMethod(percent) : percent;
    if ((stepCallback(value, now, render) === false || percent === 1) && render) {
      stoped = true
      completedCallback?.(
        desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)),
        finish,
        percent === 1 || duration == null);
    } else if (render) {
      lastFrame = now;
      requestAnimationFrame(step);
    }
  };
  // Init first step
  requestAnimationFrame(step);
  // Return unique animation ID
  const finish = function () {
    stoped = true
  }
  return finish
}