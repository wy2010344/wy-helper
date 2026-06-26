import { describe, it, expect, vi } from 'vitest'
import { throttleTask } from '../src/tasks/throttle'

describe('throttleTask', () => {
  it('returns the same promise while action is in-flight', () => {
    let release!: () => void
    const action = () => new Promise<string>(r => { release = r })
    const task = throttleTask(action)

    const p1 = task()
    const p2 = task()
    expect(p1).toBe(p2)
  })

  it('starts new action after previous one completes', async () => {
    const action = vi.fn().mockResolvedValue('ok')
    const task = throttleTask(action)

    await task()
    await task()
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('returns fresh promise for sequential calls', async () => {
    const action = vi.fn().mockResolvedValue('ok')
    const task = throttleTask(action)

    const p1 = task()
    await p1
    const p2 = task()
    expect(p1).not.toBe(p2)
  })

  it('forwards arguments to the action', async () => {
    const action = vi.fn().mockResolvedValue('ok')
    const task = throttleTask(action)

    await task('a', 1)
    expect(action).toHaveBeenCalledWith('a', 1)
  })

  it('concurrent callers share the same rejection', async () => {
    const action = vi.fn().mockRejectedValue(new Error('boom'))
    const task = throttleTask(action)

    const p1 = task()
    const p2 = task()

    await expect(p1).rejects.toThrow('boom')
    await expect(p2).rejects.toThrow('boom')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('concurrent callers share the same resolve value', async () => {
    const action = vi.fn().mockResolvedValue(42)
    const task = throttleTask(action)

    const [r1, r2] = await Promise.all([task(), task()])
    expect(r1).toBe(42)
    expect(r2).toBe(42)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('does not affect next round after rejection', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce('recovered')
    const task = throttleTask(action)

    await expect(task()).rejects.toThrow('first')
    await expect(task()).resolves.toBe('recovered')
    expect(action).toHaveBeenCalledTimes(2)
  })

  describe('didCall', () => {
    it('fires on success with correct data', async () => {
      const action = () => Promise.resolve('val')
      const didCall = vi.fn()
      const task = throttleTask(action, didCall)

      await task()
      expect(didCall).toHaveBeenCalledTimes(1)
      expect(didCall.mock.calls[0][0].type).toBe('success')
      expect(didCall.mock.calls[0][0].value).toBe('val')
    })

    it('fires on rejection with correct data', async () => {
      const action = () => Promise.reject(new Error('fail'))
      const didCall = vi.fn()
      const task = throttleTask(action, didCall)

      await expect(task()).rejects.toThrow('fail')
      expect(didCall).toHaveBeenCalledTimes(1)
      expect(didCall.mock.calls[0][0].type).toBe('error')
      expect(didCall.mock.calls[0][0].value).toBeInstanceOf(Error)
    })

    it('does not affect the original promise chain', async () => {
      const action = vi.fn().mockResolvedValue(10)
      const didCall = vi.fn()
      const task = throttleTask(action, didCall)

      const result = await task()
      expect(result).toBe(10)
    })
  })
})
