import { beforeEach, describe, expect, it } from 'vitest'
import {
  batchSignalEnd,
  collectSignal,
  createSignal,
  memo,
  signalCache,
  trackSignal,
} from '../src/index'

// 与 signal.test.ts 一致,隔离全局信号缓存
beforeEach(() => {
  const key = 'wy-helper-signal-cache'
  const cache = (globalThis as any)[key]
  if (cache) {
    cache.beginBatch = false
    cache.currentBatch = { listeners: new Set(), effects: new Map(), deps: [] }
    cache.nextBatch = { listeners: new Set(), effects: new Map(), deps: [] }
    cache.onWorkBatch = undefined
    cache.onEffectRun = undefined
    cache.currentFun = undefined
    cache.currentRelay = undefined
    cache.callGet = false
    cache.memoStack = []
  }
})

describe('memo/trackSignal 异常后的追踪状态复位', () => {
  it('batch 中 memo 抛错后追踪状态复位,后续 batch 仍正常', () => {
    const a = createSignal(1)
    const bad = memo(() => {
      const v = a.get()
      if (v > 1) {
        throw new Error('memo boom')
      }
      return v
    })
    const dispose = trackSignal(
      () => bad(),
      () => {}
    )
    batchSignalEnd()

    a.set(2)
    expect(() => batchSignalEnd()).toThrow('memo boom')

    // 追踪状态必须复位,否则下一次 batch 会因残留状态报错
    expect(signalCache.currentRelay).toBeUndefined()
    expect(signalCache.currentFun).toBeUndefined()
    expect(signalCache.memoStack.length).toBe(0)

    dispose()

    // 后续 batch 仍能正常完成
    const b = createSignal(1)
    const seen: number[] = []
    const disposeB = trackSignal(
      () => b.get(),
      v => {
        seen.push(v)
      }
    )
    batchSignalEnd()
    b.set(2)
    batchSignalEnd()
    expect(seen).toEqual([1, 2])
    disposeB()
  })

  it('memo 首次计算抛错后不复位其他 memo 的追踪', () => {
    const a = createSignal(1)
    const bad = memo(() => {
      a.get()
      throw new Error('first boom')
    })
    const good = memo(() => a.get() * 2)
    expect(() => bad()).toThrow('first boom')

    expect(signalCache.memoStack.length).toBe(0)
    expect(signalCache.currentRelay).toBeUndefined()
    // 其他 memo 不受影响,既能首次求值也能响应更新
    expect(good()).toBe(2)
    a.set(5)
    expect(good()).toBe(10)
  })

  it('collect 内抛错后 currentFun 复位,后续收集仍正常', () => {
    const collector = collectSignal(() => {})
    batchSignalEnd()

    expect(() =>
      collector.collect(() => {
        throw new Error('collect boom')
      })
    ).toThrow('collect boom')
    expect(signalCache.currentFun).toBeUndefined()

    const a = createSignal(1)
    expect(collector.collect(() => a.get())).toBe(1)
  })
})
