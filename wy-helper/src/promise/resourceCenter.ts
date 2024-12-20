import { PromiseWait, rejectAll, resolveAll } from "../observerCenter";
import { getOutResolvePromise } from "../setStateHelper";
import { valueCenterOf } from "../ValueCenter";
import { createAndFlushAbortController, hookAbortSignalPromise } from "./buildSerialRequestSingle";

/**
 * 始终依最新的请求,旧请求将被cancel掉
 * 因为新请求发生时,后台的突变已经发生
 * @param callback 
 * @param init 
 * @returns 
 */
export function resourceCenter<A, D>(callback: (
  arg: A
) => Promise<D>, init: D) {
  const valueCenter = valueCenterOf(init)
  const list: PromiseWait<D>[] = []
  const flushAbort = createAndFlushAbortController()
  let uidVersion = 1
  return [valueCenter.readonly(), function (arg: A) {
    const version = uidVersion++
    hookAbortSignalPromise(flushAbort(), () => {
      return callback(arg)
    }, function (value) {
      if (version == uidVersion) {
        if (value.type == 'success') {
          valueCenter.set(value.value)
          resolveAll(list, value.value)
        } else {
          rejectAll(list, value.value)
        }
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