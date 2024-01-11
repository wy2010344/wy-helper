import { GetValue, SetValue } from "./setStateHelper"


export type RValue<T> = {
  readonly get: GetValue<T>
  readonly value: T
}

export function initRValue<T>(get: GetValue<T>) {
  return new ComputedValueImpl<T>(get)
}

class ComputedValueImpl<T> implements RValue<T>{
  constructor(
    public readonly get: GetValue<T>
  ) { }
  get value() {
    return this.get()
  }
}

export type RWValue<T> = {
  value: T
  readonly get: GetValue<T>
  readonly set: SetValue<T>
  readonly readonly: RValue<T>
}

export function initRWValue<T>(get: GetValue<T>, set: SetValue<T>) {
  return new ModelValueImpl(get, set)
}

class ModelValueImpl<T> extends ComputedValueImpl<T> implements RWValue<T>{
  constructor(
    get: GetValue<T>,
    public readonly set: SetValue<T>
  ) {
    super(get)
  }
  get value() {
    return this.get()
  }
  set value(v: T) {
    this.set(v)
  }
  readonlyValue: RValue<T> = undefined!
  get readonly() {
    if (!this.readonlyValue) {
      this.readonlyValue = new ComputedValueImpl(this.get)
    }
    return this.readonlyValue
  }
}