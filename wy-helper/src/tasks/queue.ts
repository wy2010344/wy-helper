import { getOutResolvePromise } from '../setStateHelper';

/**
 * 排除执行任务，先进先出
 * @param action
 * @returns
 */
export function queueTasks<T extends (...vs: any[]) => Promise<any>>(
  action: T
): T {
  const tasks: {
    args: any[];
    resolve(v: any): void;
    reject(v: any): void;
  }[] = [];

  function onTaskDone() {
    tasks.shift();
    if (tasks.length) {
      requestTask();
    }
  }
  function requestTask() {
    action(...tasks[0].args)
      .then(tasks[0].resolve)
      .catch(tasks[0].reject)
      .finally(onTaskDone);
  }
  return function (...args) {
    const [promise, resolve, reject] = getOutResolvePromise();
    tasks.push({
      args,
      resolve,
      reject,
    });
    if (tasks.length == 1) {
      requestTask();
    }
    return promise;
  } as T;
}
