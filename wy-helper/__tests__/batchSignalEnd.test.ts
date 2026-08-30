import { describe, expect, it, beforeEach } from 'vitest'
import { batchSignalEnd, signalCache } from '../src/index'
import { TrackSignal } from '../src/signal/trackSignal'

function resetGlobalState() {
  signalCache.beginBatch = false
  signalCache.currentBatch = { listeners: new Set(), effects: new Map(), deps: [] }
  signalCache.nextBatch = { listeners: new Set(), effects: new Map(), deps: [] }
  signalCache.onWorkBatch = undefined
  signalCache.onEffectRun = false
  signalCache.onEffectLevel = 0
  signalCache.onEffectKeys = []
  signalCache.memoStack = []
}

beforeEach(resetGlobalState)

describe('BatchSignalEnd error handling', () => {
  it('effect error should propagate', () => {
    signalCache.beginBatch = true
    signalCache.currentBatch.effects.set(0, [
      () => {
        throw new Error('boom')
      },
    ])

    expect(() => batchSignalEnd()).toThrow('boom')
  })

  it('listener error should propagate', () => {
    signalCache.beginBatch = true
    const badListener = new TrackSignal<number>(
      () => {
        throw new Error('bad listener')
      },
      () => {}
    )
    signalCache.currentBatch.deps.pop()
    signalCache.currentBatch.listeners.add(badListener)

    expect(() => batchSignalEnd()).toThrow('bad listener')
  })

  it('error should not leave batch stuck', () => {
    signalCache.beginBatch = true
    signalCache.currentBatch.effects.set(0, [
      () => {
        throw new Error('boom')
      },
    ])

    expect(() => batchSignalEnd()).toThrow('boom')
    expect(signalCache.beginBatch).toBe(false)
    expect(signalCache.onWorkBatch).toBe(undefined)
    expect(signalCache.onEffectRun).toBe(false)
    expect(signalCache.onEffectLevel).toBe(0)
    expect(signalCache.onEffectKeys.length).toBe(0)
  })

  it('normal batch still works', () => {
    let ran = 0
    signalCache.beginBatch = true
    signalCache.currentBatch.effects.set(0, [
      () => {
        ran++
      },
    ])

    batchSignalEnd()

    expect(ran).toBe(1)
    expect(signalCache.beginBatch).toBe(false)
  })
})