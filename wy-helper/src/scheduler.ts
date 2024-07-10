import { StoreRef } from "./storeRef";
import { EmptyFun, emptyObject, messageChannelCallback } from "./util"
export const getCurrentTimePerformance = (globalThis as any).performance?.now
  ? () => performance.now()
  : () => Date.now()
export declare type AskNextTimeWork = (data: {
  realTime: StoreRef<boolean>;
  askNextWork: () => NextTimeWork | void;
}) => EmptyFun;
export declare type NextTimeWork = EmptyFun & {
  lastJob?: boolean;
};

export function createRunSyncTasks() {
  let startSyncTask = false
  const syncTasks: EmptyFun[] = []
  return function (fun: EmptyFun) {
    syncTasks.push(fun)
    if (!startSyncTask) {
      startSyncTask = true
      let task = syncTasks.pop()
      while (task) {
        task()
        task = syncTasks.pop()
      }
      startSyncTask = false
    }
  }
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
  limitFlush
}: {
  minRenderGap?: number
  lastJobDelay?: boolean
  taskTimeThreadhold?: number
  limitFlush?(fun: EmptyFun): void
} = emptyObject): AskNextTimeWork {
  const runTaskSync = createRunSyncTasks()
  return function ({
    askNextWork,
    realTime
  }) {
    let onWork = false
    let lastRenderFinishTime = 0
    function finishWork() {
      onWork = false
      lastRenderFinishTime = getCurrentTimePerformance()
    }
    /**
     * 执行queue中的任务
     * 本次没执行完,下次执行.
     * 下次一定需要在宏任务中执行
     */
    const flush = () => {
      const deadline = getCurrentTimePerformance() + taskTimeThreadhold
      let callback = askNextWork()
      while (callback) {
        if (realTime.get()) {
          callback()
          callback = askNextWork()
        } else {
          if (lastJobDelay && callback.lastJob) {
            //延时检查
            setTimeout(flush, deadline - getCurrentTimePerformance())
            break
          }
          if (getCurrentTimePerformance() < deadline) {
            callback()
            callback = askNextWork()
          } else {
            //需要中止,进入宏任务.原列表未处理完
            messageChannelCallback(flush)
            break
          }
        }
      }
      if (!callback) {
        finishWork()
      }
    }

    //render期间必须执行完成
    function requestAnimationFrameCheck() {
      if (onWork) {
        let work = askNextWork()
        while (work) {
          work()
          if (lastJobDelay && work.lastJob && !realTime.get()) {
            if (askNextWork()) {
              beginAsyncWork()
            } else {
              finishWork()
            }
            break
          }
          work = askNextWork()
        }
      }
    }

    function beginAsyncWork() {
      messageChannelCallback(flush)
      limitFlush?.(requestAnimationFrameCheck)
    }
    return function () {
      if (!onWork) {
        onWork = true
        if (realTime.get()) {
          runTaskSync(flush)
        } else {
          const delay = minRenderGap - (getCurrentTimePerformance() - lastRenderFinishTime)
          if (delay > 0) {
            setTimeout(beginAsyncWork, delay)
          } else {
            beginAsyncWork()
          }
        }
      }
    }
  }
}