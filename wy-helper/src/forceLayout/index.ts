import { createSignal } from '../signal'
import { storeRef, StoreRef } from '../storeRef'
import { ForceDir } from './forceModel'

export * from './collide'
export * from './dir'
export * from './link'
export * from './manyBody'
export * from './radial'
export * from './forceModel'

export interface SignalForceDir extends ForceDir {

  readonly vSignal: StoreRef<number>

  readonly dSignal: StoreRef<number>

  readonly fSignal: StoreRef<number | undefined>
}
export class SignalForceDirImpl implements SignalForceDir {

  readonly vSignal: StoreRef<number>

  readonly dSignal: StoreRef<number>

  readonly fSignal: StoreRef<number | undefined>

  constructor(
    d: number,
    v: number,
    f?: number
  ) {
    this.dSignal = createSignal(d)
    this.vSignal = createSignal(v)
    this.fSignal = createSignal(f)
  }

  get d() {
    return this.dSignal.get()
  }
  set d(v) {
    this.dSignal.set(v)
  }
  get v() {
    return this.vSignal.get()
  }
  set v(v) {
    this.vSignal.set(v)
  }
  get f() {
    return this.fSignal.get()
  }
  set f(v) {
    this.fSignal.set(v)
  }
}
export function createSignalForceDir(
  d: number,
  v = 0,
  f?: number
) {
  return new SignalForceDirImpl(d, v, f)
}
const emptySignal = storeRef(0)
export const emptySignalForceDir: SignalForceDir = {
  d: 0,
  dSignal: emptySignal,
  v: 0,
  vSignal: emptySignal,
  fSignal: storeRef(undefined)
}