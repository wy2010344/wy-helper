import { SetValue } from "../setStateHelper"
import { emptyFun, emptyObject } from '../util'
import { StoreRef } from "../storeRef"
import { AnimateSignalConfig } from "./baseAnimateFrame"
import { batchSignalEnd } from "../signal"
/**
 * 或者视着实例而非消息,即是可变的,只在事件中不变
 * 第一次不处理
 */

export function createSubscribeRequestAnimationFrame(
  requestAnimationFrame: (fun: SetValue<number>) => void,
) {
  return function (
    /**返回true就是停止 */
    callback: (time: number) => any,
    /**
     * 动画结束,成功是true,外部触发是false
     */
    onFinish: SetValue<boolean> = emptyFun
  ) {
    let canceled = false
    function cancel() {
      canceled = true
      onFinish(false)
    }
    function request(time: number) {
      if (canceled) {
        return
      }
      if (callback(time)) {
        onFinish(true)
        return
      }
      requestAnimationFrame(request)
    }
    requestAnimationFrame(request)
    return cancel
  }
}

export type SubscribeRequestAnimationFrame = ReturnType<typeof createSubscribeRequestAnimationFrame>


export interface AnimationTime {
  (n: number): void
}
export function createAnimationTime(
  callback: (diffTime: number, setDisplacement: SetValue<number>) => any,
): AnimateSignalConfig {
  return function (
    value: StoreRef<number>
  ) {
    let startTime = performance.now()
    const out = new SilentDiff(value)
    function setDisplacement(n: number) {
      value.set(out.getInitValue() + n)
    }
    return {
      callback(time) {
        const diffTime = time - startTime
        if (diffTime > 0) {
          return callback(diffTime, setDisplacement)
        }
      },
      out
    }
  }
}

export class SilentDiff {
  constructor(
    private value: StoreRef<number>
  ) {
    this.initValue = value.get()
  }
  private initValue: number
  getInitValue() {
    return this.initValue
  }
  silentDiff(n: number) {
    this.initValue = this.initValue + n
    this.value.set(this.value.get() + n)
    batchSignalEnd()
  }
}
// export type AnimateFrameEvent = {
//   from?: number
//   onProcess?(v: number): void
//   onFinish?(v: boolean): void
// }

// export interface AnimateConfig {
//   target: number
//   from: number,
//   config: AnimationConfig
// }

// type AnimateSetValue = (v: number, onProcess?: boolean) => void

// export interface AnimateConfigA extends AnimateConfig {
//   update(diffTime: number, onProcess?: boolean): boolean
//   reDo(): void
// }


// class AnimateToImplTime implements AnimateConfigA {
//   constructor(
//     public from: number,
//     public target: number,
//     public config: AnimationConfig,
//     private setValue: AnimateSetValue
//   ) { }

//   private timePeriod = performance.now()
//   private time: number = 0
//   update(date: number, onProcess?: boolean) {
//     const diffTime = date - this.timePeriod
//     if (diffTime > 0) {
//       this.time = date
//       const out = this.config(diffTime)
//       const value = out[0]
//       this.setValue(this.from + value, onProcess)
//       return out[1]
//     }
//     return false
//   }
//   reDo() {
//     this.update(this.time)
//   }
// }
// /**
//  * @deprecated 使用animateSignal
//  * 使用react的render,可能不平滑,因为react是异步的,生成值到渲染到视图上,可能有时间间隔
//  * 或者总是使用flushSync.
//  */
// export class AbsAnimateFrameValue {
//   constructor(
//     public readonly get: GetValue<number>,
//     private didSet: SetValue<number>,
//     private trySet: SetValue<number>,
//     private subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
//   ) {
//   }
//   /**
//    * 如果正在发生动画,这个值存在
//    * 这个转成中性的,与配置相关...
//    */
//   private animateConfig: AnimateConfigA | undefined = undefined

//   protected setAnimateConfig(v?: AnimateConfigA) {
//     this.animateConfig = v
//   }
//   getAnimateConfig() {
//     return this.animateConfig
//   }
//   getTargetValue(): number {
//     if (this.animateConfig) {
//       return this.animateConfig.target
//     }
//     return this.get()
//   }

//   private lastCancel = emptyFun

//   private clear() {
//     this.lastCancel = emptyFun
//     this.setAnimateConfig()
//   }
//   slientChange(target: number) {
//     if (this.animateConfig) {
//       this.animateConfig.from = this.animateConfig.from + target - this.animateConfig.target
//       this.animateConfig.target = target
//       this.animateConfig.reDo()
//     } else {
//       this.didSet(target)
//       return true
//     }
//   }
//   changeDiff(diff: number, getConfig?: GetDeltaXAnimationConfig, event: Omit<AnimateFrameEvent, 'from'> = emptyObject) {
//     return this.changeTo(this.get() + diff, getConfig, event)
//   }
//   slientDiff(diff: number) {
//     if (this.animateConfig) {
//       this.animateConfig.from = this.animateConfig.from + diff
//       this.animateConfig.target = this.animateConfig.target + diff
//       this.animateConfig.reDo()
//     } else {
//       this.didSet(this.get() + diff)
//     }
//   }
//   animateTo(
//     target: number,
//     config: GetDeltaXAnimationConfig = defaultSpringBaseAnimationConfig,
//     c: {
//       from?: number,
//       onProcess?: EmptyFun
//     } = emptyObject) {
//     const from = c.from || this.get()
//     if (from != target) {
//       return new Promise<boolean>(resolve => {
//         this.changeTo(target, config, {
//           from: c.from,
//           onProcess: c.onProcess,
//           onFinish: resolve
//         })
//       })
//     }
//   }
//   changeTo(target: number, getConfig?: GetDeltaXAnimationConfig, {
//     from,
//     onProcess = emptyFun,
//     onFinish = emptyFun
//   }: AnimateFrameEvent = emptyObject) {
//     if (!getConfig) {
//       //中止动画
//       this.lastCancel()
//       this.didSet(target)
//       return 'immediately'
//     }
//     const { setValue, baseValue, needReset } = this.initConfig(from, onProcess)
//     const config = getConfig(target - baseValue)
//     if (!config) {
//       //超越检测动画
//       this.didSet(target)
//       onFinish(true)
//       return 'immediately'
//     }
//     const animateTo = new AnimateToImplTime(
//       baseValue,
//       target,
//       config,
//       setValue)
//     this.beginAnimate(animateTo, needReset, onFinish)
//     return 'animate'
//   }

//   stop() {
//     if (this.animateConfig) {
//       this.changeTo(this.get())
//     }
//   }
//   private initConfig(from: number | undefined, onProcess: SetValue<number>) {
//     const that = this
//     let needReset = false
//     let baseValue = 0
//     if (typeof from != 'undefined') {
//       needReset = true
//       baseValue = from
//     } else {
//       baseValue = this.get()
//     }
//     this.lastCancel()
//     const setValue: AnimateSetValue = (v, o) => {
//       that.trySet(v)
//       if (o) {
//         onProcess(v)
//       }
//     }
//     return {
//       setValue,
//       needReset,
//       baseValue
//     }
//   }
//   private beginAnimate(
//     animateTo: AnimateConfigA,
//     needReset: boolean,
//     onFinish: SetValue<boolean>
//   ) {
//     const that = this
//     this.setAnimateConfig(animateTo)
//     if (needReset) {
//       animateTo.reDo()
//     }
//     const cancel = this.subscribeRequestAnimateFrame(
//       function (date) {
//         const finished = animateTo.update(date, true)
//         if (finished) {
//           cancel()
//           that.clear()
//           //在trigger里访问到animateTo已经结束
//           onFinish(true)
//         }
//       })
//     this.lastCancel = function () {
//       cancel()
//       that.clear()
//       //在trigger里访问到animateTo已经结束
//       onFinish(false)
//     }
//   }
// }

// export class AnimateFrameValue extends AbsAnimateFrameValue implements ReadValueCenter<number> {
//   private valueCenter: ValueCenter<number>
//   constructor(
//     value: number, subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
//   ) {
//     const valueCenter = valueCenterOf(value)
//     const set = valueCenter.set.bind(valueCenter)
//     super(
//       valueCenter.get.bind(valueCenter),
//       set,
//       set,
//       subscribeRequestAnimateFrame
//     )
//     this.valueCenter = valueCenter
//   }
//   subscribe(notify: (v: number, old: number) => void): EmptyFun {
//     return this.valueCenter.subscribe(notify)
//   }
// }


// export class SignalAnimateFrameValue extends AbsAnimateFrameValue {
//   constructor(
//     value: number,
//     subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
//   ) {
//     const signal = createSignal(value)
//     super(
//       signal.get,
//       signal.set,
//       function (v) {
//         if (signalOnUpdate()) {
//           addEffect(() => {
//             signal.set(v)
//             batchSignalEnd()
//           })
//         } else {
//           signal.set(v)
//         }
//       },
//       subscribeRequestAnimateFrame
//     )
//   }
//   private onAnimate = createSignal(false)
//   protected setAnimateConfig(v?: AnimateConfigA): void {
//     super.setAnimateConfig(v)
//     this.onAnimate.set(Boolean(v))
//   }
//   getAnimateConfig(): AnimateConfigA | undefined {
//     //使其可观察
//     this.onAnimate.get()
//     return super.getAnimateConfig()
//   }
// }