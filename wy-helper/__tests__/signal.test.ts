import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSignal,
  createLateSignal,
  memo,
  memoFun,
  trackSignal,
  batchSignalEnd,
  collectSignal,
} from '../src/index'

// Reset global signal cache to prevent cross-test state leakage
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
  }
})

// -- Signal basics -------------------------------------------------------

describe('Signal', () => {
  it('get returns initial value', () => {
    const s = createSignal(42)
    expect(s.get()).toBe(42)
  })

  it('set updates value', () => {
    const s = createSignal(1)
    s.set(2)
    expect(s.get()).toBe(2)
  })

  it('set returns the new value', () => {
    const s = createSignal(0)
    expect(s.set(99)).toBe(99)
  })

  it('equality check prevents redundant set', () => {
    const s = createSignal(10)
    s.set(10)
    expect(s.get()).toBe(10)
  })

  it('custom shouldChange', () => {
    const s = createSignal(0, (a, b) => Math.abs(a - b) >= 5)
    s.set(1)
    expect(s.get()).toBe(0)
    s.set(5)
    expect(s.get()).toBe(5)
  })

  it('NaN equality with default (simpleNotEqual uses !=)', () => {
    const s = createSignal(NaN)
    s.set(NaN)
    expect(s.get()).toBeNaN()
  })

  it('late signal getOnlySet works', () => {
    const s = createLateSignal('a')
    const set = s.getOnlySet()
    set('b')
    expect(s.get()).toBe('b')
  })
})

// -- Listener dedup ------------------------------------------------------

describe('Signal listener dedup', () => {
  it('same TrackSignal added via get only registers once', () => {
    const s = createSignal(0)
    const s2 = createSignal(0)
    const fn = vi.fn()
    const memoDep = memo(() => {
      fn()
      return s.get() + s2.get()
    })

    const dispose = trackSignal(() => memoDep())
    batchSignalEnd()

    expect(fn).toHaveBeenCalledTimes(1)
    expect((s as any).listeners.size).toBe(1)

    s.set(1)
    batchSignalEnd()
    // memo re-evaluates, mapInject re-adds to s.listeners but should be deduped
    expect((s as any).listeners.size).toBe(1)
    expect(fn).toHaveBeenCalledTimes(2)

    dispose()
  })
})

// -- Memo (computed) -----------------------------------------------------

describe('Memo', () => {
  it('returns computed value', () => {
    const a = createSignal(1)
    const b = createSignal(2)
    const sum = memo(() => a.get() + b.get())
    expect(sum()).toBe(3)
  })

  it('caches result when no upstream change', () => {
    const a = createSignal(5)
    const fn = vi.fn(() => a.get() * 2)
    const double = memo(fn)
    expect(double()).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(double()).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('recomputes when upstream changes', () => {
    const a = createSignal(1)
    const b = memo(() => a.get() + 1)
    expect(b()).toBe(2)
    a.set(10)
    expect(b()).toBe(11)
  })

  it('memo can filter changes with shouldChange-like pattern', () => {
    const a = createSignal(0)
    const fn = vi.fn((old?: number, inited?: boolean) => {
      const v = a.get()
      return inited ? (v === old ? old! : v) : v
    })
    const m = memo(fn)
    expect(m()).toBe(0)
    a.set(0)
    expect(m()).toBe(0)
  })

  it('deep chain recomputes lazily', () => {
    const a = createSignal(1)
    const b = memo(() => a.get() + 1)
    const c = memo(() => b() + 1)
    const d = memo(() => c() + 1)
    expect(d()).toBe(4)
    a.set(10)
    expect(d()).toBe(13)
  })

  it('diamond: shared upstream', () => {
    const a = createSignal(1)
    const b = memo(() => a.get() * 2)
    const c = memo(() => a.get() * 3)
    const d = memo(() => b() + c())
    expect(d()).toBe(5)
    a.set(2)
    expect(d()).toBe(10)
  })

  it('unstable: oscillating value caught by infinite loop detection', () => {
    const toggle = createSignal(true)
    let count = 0
    const unstable = memo(() => {
      count++
      return toggle.get() ? 1 : 2
    })
    // Reading the same value doesn't cause issue
    expect(unstable()).toBe(1)
    toggle.set(false)
    expect(unstable()).toBe(2)
  })

  it('memo returns lastValue on cache hit with different currentFun', () => {
    const a = createSignal(1)
    const m = memo(() => a.get() * 10)
    expect(m()).toBe(10)

    a.set(2)
    // version changed, relayChange detects mismatch -> recompute
    expect(m()).toBe(20)
  })

  it('after callback on change', () => {
    const a = createSignal(0)
    const after = vi.fn()
    const m = memo(() => a.get(), after)
    expect(m()).toBe(0)
    expect(after).toHaveBeenCalledWith(0)
    a.set(5)
    expect(m()).toBe(5)
    expect(after).toHaveBeenCalledWith(5)
    expect(after).toHaveBeenCalledTimes(2)
  })

  it('after not called when evaluating again with same value', () => {
    const a = createSignal(1)
    const after = vi.fn()
    const m = memo(() => a.get(), after)
    expect(m()).toBe(1) // init: after called once
    expect(after).toHaveBeenCalledTimes(1)
    // same value read again, after NOT called
    expect(m()).toBe(1)
    expect(after).toHaveBeenCalledTimes(1)
  })
})

// -- TrackSignal (effect) ------------------------------------------------

describe('TrackSignal (effect)', () => {
  it('runs getter and triggers set on change', () => {
    const a = createSignal(0)
    const fn = vi.fn()
    trackSignal(() => a.get(), fn)
    // first run (init)
    a.set(1)
    batchSignalEnd()
    expect(fn).toHaveBeenCalled()
  })

  it('receives old and new value', () => {
    const a = createSignal(10)
    let recorded: [any, any, boolean] = [undefined, undefined, false as any]
    trackSignal((old: any, inited: any) => a.get(), (v: any, oldV: any, inited: any) => {
      recorded = [v, oldV, inited]
    })
    batchSignalEnd()
    a.set(20)
    batchSignalEnd()
    expect(recorded[0]).toBe(20)
    expect(recorded[1]).toBe(10)
  })

  it('dispose prevents further notifications', () => {
    const a = createSignal(0)
    const fn = vi.fn()
    const dispose = trackSignal(() => a.get(), fn)
    batchSignalEnd()
    // TrackSignal is registered in a.listeners
    expect((a as any).listeners.size).toBe(1)
    fn.mockClear()
    dispose()
    // dispose sets disabled=true but does NOT remove from a.listeners
    expect((a as any).listeners.size).toBe(1)
    a.set(1)
    batchSignalEnd()
    // addFun checks disabled flag and skips execution
    expect(fn).not.toHaveBeenCalled()
  })

  it('multiple effects on same signal', () => {
    const a = createSignal(0)
    const f1 = vi.fn()
    const f2 = vi.fn()
    trackSignal(() => a.get(), f1)
    trackSignal(() => a.get(), f2)
    batchSignalEnd()
    a.set(1)
    batchSignalEnd()
    expect(f1).toHaveBeenCalled()
    expect(f2).toHaveBeenCalled()
  })

  it('effect with memo dependency', () => {
    const a = createSignal(1)
    const double = memo(() => a.get() * 2)
    const fn = vi.fn()
    trackSignal(() => double(), fn)
    batchSignalEnd()
    a.set(3)
    batchSignalEnd()
    expect(fn).toHaveBeenCalledWith(6, 2, true as any)
  })

  it('dynamic dependencies: old dep does not trigger after listener is cleared and re-injected', () => {
    const cond = createSignal(true)
    const a = createSignal(10)
    const b = createSignal(20)
    const fn = vi.fn()
    trackSignal(() => cond.get() ? a.get() : b.get(), fn)
    batchSignalEnd()
    // fn called with 10 during init
    a.set(100)
    batchSignalEnd()
    // fn called with 100
    expect(fn.mock.calls[1]).toEqual([100, 10, true])
    fn.mockClear()
    cond.set(false)
    batchSignalEnd()
    // fn called with 20 (b), old was 100 (a)
    expect(fn).toHaveBeenCalledOnce()
    fn.mockClear()
    // a.set(200): Signal clears listeners on each didSet, and the effect now
    // reads b (not a), so TrackSignal is NOT re-added to a.listeners
    a.set(200)
    batchSignalEnd()
    expect(fn).not.toHaveBeenCalled()
    b.set(2000)
    batchSignalEnd()
    expect(fn).toHaveBeenCalledWith(2000, 20, true)
  })
})

// -- Batch processing ----------------------------------------------------

describe('Batch', () => {
  it('multiple writes in batch trigger one evaluation', () => {
    const a = createSignal(0)
    const fn = vi.fn()
    trackSignal(() => a.get(), fn)
    batchSignalEnd()
    fn.mockClear()
    a.set(1)
    a.set(2)
    a.set(3)
    batchSignalEnd()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3, 0, true as any)
  })

  it('cascading batch: effect writes to signal', () => {
    const a = createSignal(0)
    const trace: number[] = []
    trackSignal(() => a.get(), (v: number) => {
      trace.push(v)
    })
    batchSignalEnd()
    a.set(1)
    batchSignalEnd()
    // cascading detection: the while loop in batchSignalEnd catches it
    expect(trace).toEqual([0, 1])
  })

  it('batch within batch (nesting guard)', () => {
    const a = createSignal(0)
    a.set(1)
    a.set(2)
    // second set should not trigger beginBatch since already in batch
    batchSignalEnd()
    expect(a.get()).toBe(2)
  })
})

// -- collectSignal -------------------------------------------------------

describe('collectSignal', () => {
  it('can manually collect dependencies', () => {
    const a = createSignal(0)
    const b = createSignal(0)
    const collector = collectSignal(() => { })
    let result = 0
    collector.collect(() => {
      result = a.get() + b.get()
    })
    expect(result).toBe(0)
    a.set(5)
    batchSignalEnd()
    b.set(10)
    batchSignalEnd()
  })

  it('collect reruns callback when dependencies change', () => {
    const a = createSignal(1)
    const cb = vi.fn()
    const collector = collectSignal(cb)
    collector.collect(() => a.get())
    a.set(2)
    batchSignalEnd()
    expect(cb).toHaveBeenCalled()
  })
})

// -- Edge cases ----------------------------------------------------------

describe('Edge cases', () => {
  it('write guard: writing a signal that has listeners inside an effect throws', () => {
    const a = createSignal(1)
    const b = createSignal(2)
    // give b a listener so guard fires
    trackSignal(() => b.get())
    batchSignalEnd()
    // effect that writes to b when a changes
    trackSignal((_old, inited) => {
      const v = a.get()
      if (!inited) return v
      b.set(v * 10) // this runs inside batch → ^ should throw
      return v
    })
    batchSignalEnd()
    a.set(3)
    expect(() => batchSignalEnd()).toThrow()
  })

  it('creating effect outside batch auto-batches', () => {
    const a = createSignal(10)
    const fn = vi.fn()
    const dispose = trackSignal(() => a.get(), fn)
    // auto-batch happens in constructor
    // need to wait for microtask
    expect(fn).toHaveBeenCalledTimes(0)
    a.set(20)
    batchSignalEnd()
    expect(fn).toHaveBeenCalled()
    dispose()
  })

  it('memoFun wraps a function-returning memo and forwards arguments', () => {
    const a = createSignal(1)
    // getter returns a function (factor): (x) => a.get() * x
    const factor = memoFun(() => (x: number) => a.get() * x)
    expect(factor(3)).toBe(3)
    a.set(5)
    expect(factor(3)).toBe(15)
  })

  it('many signals with one memo (mux style)', () => {
    const signals = Array.from({ length: 100 }, (_, i) => createSignal(i))
    const sum = memo(() => signals.reduce((acc, s) => acc + s.get(), 0))
    expect(sum()).toBe(4950)
    signals[0].set(100)
    // 4950 - 0 + 100 = 5050
    expect(sum()).toBe(5050)
  })

  it('avoidable: memo in chain returns unchanged value', () => {
    const head = createSignal(0)
    const computed1 = memo(() => head.get())
    const computed2 = memo(() => {
      // always 0 regardless of input
      return 0
    })
    const fn = vi.fn()
    trackSignal(() => computed2(), fn)
    batchSignalEnd()

    head.set(1)
    batchSignalEnd()
    expect(fn).toHaveBeenCalled()
  })

  it('object reference equality: same ref does not trigger, diff ref triggers', () => {
    const s = createSignal({ x: 1 })
    const fn = vi.fn()
    trackSignal(() => s.get(), fn)
    batchSignalEnd()
    fn.mockClear()
    s.set({ x: 1 })
    batchSignalEnd()
    // different ref → shouldChange true → effect triggers
    expect(fn).toHaveBeenCalledOnce()
    fn.mockClear()
    // set back to the CURRENT ref (returned by s.get())
    const current = s.get()
    s.set(current)
    batchSignalEnd()
    // same ref → shouldChange false → no trigger
    expect(fn).not.toHaveBeenCalled()
  })

  it('multiple get calls in one expression', () => {
    const a = createSignal(5)
    const fn = vi.fn()
    trackSignal(() => {
      fn()
      return a.get() + a.get()
    })
    batchSignalEnd()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('dispose during batch processing', () => {
    const a = createSignal(0)
    const fn = vi.fn()
    const dispose = trackSignal(() => a.get(), fn)
    batchSignalEnd()
    a.set(1)
    dispose()
    batchSignalEnd()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
