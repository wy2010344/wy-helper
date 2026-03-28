import { GetValue, SetValue } from './setStateHelper';
import { StoreRef } from './storeRef';
import { EmptyFun, emptyObject, messageChannelCallback } from './util';
export const getCurrentTimePerformance = (globalThis as any).performance?.now
  ? () => performance.now()
  : () => Date.now();

export type AskNextTimeWorkParam<T> = {
  realTime: GetValue<boolean>;
  getArg(): T;
  askNextWork: () => NextTimeWork<T> | void;
};
export type AskNextTimeWork<T> = (data: AskNextTimeWorkParam<T>) => EmptyFun;
export declare type NextTimeWork<T> = SetValue<T> & {
  lastJob?: boolean;
};

export function createRunSyncTasks() {
  let startSyncTask = false;
  const syncTasks: EmptyFun[] = [];
  return function (fun: EmptyFun) {
    syncTasks.push(fun);
    if (!startSyncTask) {
      startSyncTask = true;
      let task = syncTasks.pop();
      while (task) {
        task();
        task = syncTasks.pop();
      }
      startSyncTask = false;
    }
  };
}

let currentThread: number = 0;
export function hookCurrentThread() {
  return currentThread;
}
/**
 * 提前执行掉一些工作,却可能回滚
 * @param param0
 * @returns
 */
export function getScheduleAskTime({
  minRenderGap = 5,
  lastJobDelay,
  taskTimeThreadhold = 5,
  limitFlush,
}: {
  minRenderGap?: number;
  lastJobDelay?: boolean;
  taskTimeThreadhold?: number;
  limitFlush?(fun: EmptyFun): void;
} = emptyObject) {
  const runTaskSync = createRunSyncTasks();
  return function <T>({
    askNextWork,
    realTime,
    getArg,
  }: AskNextTimeWorkParam<T>) {
    let onWork = false;
    let lastRenderFinishTime = 0;
    function finishWork() {
      onWork = false;
      lastRenderFinishTime = getCurrentTimePerformance();
    }
    /**
     * 执行queue中的任务
     * 本次没执行完,下次执行.
     * 下次一定需要在宏任务中执行
     */
    const flush = () => {
      const time = getCurrentTimePerformance();
      currentThread = time;
      const deadline = time + taskTimeThreadhold;
      let callback = askNextWork();
      let count = 0;
      while (callback) {
        if (realTime()) {
          callback(getArg());
          count++;
          callback = askNextWork();
        } else {
          if (lastJobDelay && callback.lastJob) {
            if (count) {
              //延时检查
              setTimeout(flush, deadline - getCurrentTimePerformance());
              break;
            } else {
              //本来就是第一个，立即执行
              callback(getArg());
              count++;
              callback = askNextWork();
            }
          } else if (getCurrentTimePerformance() < deadline) {
            callback(getArg());
            count++;
            callback = askNextWork();
          } else {
            //需要中止,进入宏任务.原列表未处理完
            messageChannelCallback(flush);
            break;
          }
        }
      }
      if (!callback) {
        finishWork();
      }
      currentThread = 0;
    };

    //render期间必须执行完成
    //这个守卫方法是为了让render在一帧内强制完成
    function requestAnimationFrameCheck() {
      if (onWork) {
        let work = askNextWork();
        while (work) {
          work(getArg());
          if (lastJobDelay && work.lastJob && !realTime()) {
            if (askNextWork()) {
              beginAsyncWork();
            } else {
              finishWork();
            }
            break;
          }
          work = askNextWork();
        }
      }
    }

    function beginAsyncWork() {
      messageChannelCallback(flush);
      limitFlush?.(requestAnimationFrameCheck);
    }
    return function () {
      if (!onWork) {
        onWork = true;
        if (realTime()) {
          runTaskSync(flush);
        } else {
          const delay =
            minRenderGap - (getCurrentTimePerformance() - lastRenderFinishTime);
          if (delay > 0) {
            setTimeout(beginAsyncWork, delay);
          } else {
            beginAsyncWork();
          }
        }
      }
    };
  };
}
