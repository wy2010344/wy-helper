import { describe, expect, it } from 'vitest'
import { createRunSyncTasks } from '../src/index'

describe('createRunSyncTasks', () => {
  it('同一轮内的嵌套任务会在外层结束后执行', () => {
    const runSync = createRunSyncTasks()
    const trace: string[] = []
    runSync(() => {
      trace.push('outer-start')
      runSync(() => trace.push('inner'))
      trace.push('outer-end')
    })
    // 首批任务在外层任务结束后由同一轮循环弹出执行
    expect(trace).toEqual(['outer-start', 'outer-end', 'inner'])
  })

  it('任务抛错后锁释放,错误继续上抛且后续任务仍可执行', () => {
    const runSync = createRunSyncTasks()
    const trace: string[] = []
    expect(() =>
      runSync(() => {
        trace.push('first')
        runSync(() => trace.push('inner'))
        throw new Error('boom')
      })
    ).toThrow('boom')

    // 抛错时未执行的排队任务被丢弃
    expect(trace).toEqual(['first'])

    // 若锁未复位,这里将不会执行任何任务
    runSync(() => trace.push('after'))
    expect(trace).toEqual(['first', 'after'])
  })
})
