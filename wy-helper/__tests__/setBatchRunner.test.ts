import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  batchSignalEnd,
  createSignal,
  setBatchRunner,
  trackSignal,
} from '../src/index'

// setBatchRunner：为测试注入确定性批处理调度，替代模块级 MessageChannel 端口。
// 语义约定：runner 收 flush，调用方决定何时执行批次（可异步推迟）。
// 注意不要在构造期改同步 runner——batch 的构造时序是先排队后 push deps，
// 同步 flush 会冲掉空批次，属于语义退化场景，异步注入才是契约。
describe('setBatchRunner', () => {
  afterEach(() => {
    setBatchRunner(undefined)
  })

  it('注入收集式 runner：set 后不立即通知，flush 才执行', () => {
    const pending: Array<() => void> = []
    setBatchRunner(fn => {
      pending.push(fn)
    })
    const a = createSignal(0)
    const fn = vi.fn()
    trackSignal(() => a.get(), fn)
    // 冲掉构造期的批次（做初始化绑定）
    pending.splice(0).forEach(run => run())
    fn.mockClear()

    a.set(1)
    expect(fn).not.toHaveBeenCalled()
    pending.splice(0).forEach(run => run())
    expect(fn).toHaveBeenCalledWith(1, 0, true)
  })

  it('同一任务多次 set 合并为一次 flush，监听者只收到最终值', () => {
    const pending: Array<() => void> = []
    setBatchRunner(fn => {
      pending.push(fn)
    })
    const a = createSignal(0)
    const fn = vi.fn()
    trackSignal(() => a.get(), fn)
    pending.splice(0).forEach(run => run())
    fn.mockClear()

    a.set(1)
    a.set(2)
    a.set(3)
    // 两次 set 之间 listener 已被消费清空，后续 set 不再排队——只有一次 flush
    expect(fn).not.toHaveBeenCalled()
    pending.splice(0).forEach(run => run())
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3, 0, true)
  })

  it('setBatchRunner(undefined) 复位后恢复默认异步调度', () => {
    setBatchRunner(fn => fn())
    setBatchRunner(undefined)
    const a = createSignal(0)
    const fn = vi.fn()
    trackSignal(() => a.get(), fn)
    batchSignalEnd()
    fn.mockClear()

    a.set(1)
    expect(fn).not.toHaveBeenCalled()
    batchSignalEnd()
    expect(fn).toHaveBeenCalled()
  })
})