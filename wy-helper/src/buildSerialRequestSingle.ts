import { emptyFun } from "./util"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}

export function buildSerialRequestSingle<Req extends any[], Res>(
  callback: (...vs: Req) => Promise<Res>,
  effect: (res: PromiseResult<Res>) => void = emptyFun,
  cacheList: Req[] = []
) {
  return function (...vs: Req) {
    cacheList.push(vs)
    if (cacheList.length == 1) {
      //之前是空的
      const checkRun = () => {
        cacheList.shift()
        if (cacheList.length) {
          //如果有值,继续操作
          circleRun()
          return false
        }
        return true
      }
      const circleRun = () => {
        while (cacheList.length > 1) {
          cacheList.shift()
        }
        callback(...cacheList[0])
          .then(res => {
            if (checkRun()) {
              effect({
                type: "success",
                value: res
              })
            }
          })
          .catch(err => {
            if (checkRun()) {
              effect({
                type: "error",
                value: err
              })
            }
          })
      }
      circleRun()
    }
  }
}