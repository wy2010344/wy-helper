import { PromiseWait, rejectAll, resolveAll } from "../observerCenter";
import { getOutResolvePromise } from "../setStateHelper";
import { valueCenterOf } from "../ValueCenter";
import { createAndFlushAbortController } from "./buildSerialRequestSingle";

/**
 * 始终依最新的请求,旧请求将被cancel掉
 * 因为新请求发生时,后台的突变已经发生
 * @param callback 
 * @param init 
 * @returns 
 */
export function resourceCenter<A, D>(callback: (
  arg: A,
  signal?: AbortSignal
) => Promise<D>, init: D) {
  const valueCenter = valueCenterOf(init)
  const list: PromiseWait<D>[] = []
  const flushAbort = createAndFlushAbortController()
  let uidVersion = 1
  return [valueCenter.readonly(), function (arg: A) {
    const version = uidVersion++
    callback(arg, flushAbort())
      .then(value => {
        if (version == uidVersion) {
          valueCenter.set(value)
          resolveAll(list, value)
          list.length = 0
        }
      })
      .catch(err => {
        if (version == uidVersion) {
          rejectAll(list, err)
          list.length = 0
        }
      })
    const [promise, resolve, reject] = getOutResolvePromise<D>()
    list.push({
      resolve,
      reject
    })
    return promise
  }] as const
}