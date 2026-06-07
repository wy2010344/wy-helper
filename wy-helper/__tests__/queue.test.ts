import { describe, it, expect, vi } from 'vitest'
import { queueTasks } from '../src/index'

describe('queueTasks', () => {
  it('executes tasks in FIFO order', async () => {
    const order: number[] = []
    const action = async (id: number) => { order.push(id) }
    const queued = queueTasks(action)

    queued(1); queued(2); queued(3)
    await vi.waitFor(() => expect(order).toEqual([1, 2, 3]))
  })

  it('only starts next task after current one completes', async () => {
    let release!: () => void
    const action = vi.fn().mockImplementation(() => new Promise<void>(r => { release = r }))
    const queued = queueTasks(action)

    queued(1); queued(2)
    expect(action).toHaveBeenCalledTimes(1)
    release()
    await vi.waitFor(() => expect(action).toHaveBeenCalledTimes(2))
  })

  it('forwards arguments to the action', async () => {
    const action = vi.fn().mockResolvedValue(undefined)
    const queued = queueTasks(action)

    queued('a', 1)
    await vi.waitFor(() => expect(action).toHaveBeenCalledWith('a', 1))
  })

  it('resolves with the action result', async () => {
    const action = async (x: number) => x * 2
    const queued = queueTasks(action)

    await expect(queued(21)).resolves.toBe(42)
  })

  it('rejection does not block subsequent tasks', async () => {
    const action = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')
    const queued = queueTasks(action)

    const errPromise = queued(1)
    const okPromise = queued(2)

    await expect(errPromise).rejects.toThrow('fail')
    await expect(okPromise).resolves.toBe('ok')
  })

  it('maintains FIFO order with varying async durations', async () => {
    const order: number[] = []
    const action = vi.fn().mockImplementation(async (id: number, delay: number) => {
      await new Promise(r => setTimeout(r, delay))
      order.push(id)
    })
    const queued = queueTasks(action)

    queued(1, 30); queued(2, 10); queued(3, 0)
    await vi.waitFor(() => expect(order).toEqual([1, 2, 3]))
  })

  it('handles synchronously resolving action', async () => {
    const action = vi.fn().mockResolvedValue('done')
    const queued = queueTasks(action)

    const r1 = queued()
    const r2 = queued()
    await expect(r1).resolves.toBe('done')
    await expect(r2).resolves.toBe('done')
  })
})
