import { test } from 'vitest'
import { batchSignalEnd, createSignal, delay, memo, trackSignal } from '../src'



test('abc', async () => {

  const a = createSignal(0)
  const b = createSignal(0)

  const a1 = (() => {
    console.log('regenerate-')
    return {
      value: a.get()
    }
  })
  const b1 = (() => {
    return {
      value: b.get() + 1
    }
  })

  const c = memo(() => {
    console.log('render---c')
    return a1().value + a1().value + b1().value + a.get()
  })

  trackSignal(() => {
    console.log('render')
    return a1().value + b1().value + c()
  }, (v) => {
    console.log("result", v)
  })

  await delay(1000)

  a.set(a.get() + 1)
  b.set(b.get() + 1)

  batchSignalEnd()
})