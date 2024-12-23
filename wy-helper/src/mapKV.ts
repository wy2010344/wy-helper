import { arrayEqual, simpleEqual } from "./equal"
import { EqualsMap } from "./EqualsMap"

export interface RMap<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
  forEach(fun: (value: V, key: K) => void): void
}


function orArrayEqual(a: any, b: any) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayEqual(a, b, simpleEqual)
  }
}

export function arrayOrOneMapCreater<K, V>() {
  return new EqualsMap<K, V>(orArrayEqual)
}


export function normalMapCreater<K, V>() {
  return new Map<K, V>()
}

function arraySimpleEqual(a: readonly any[], b: readonly any[]) {
  return arrayEqual(a, b, simpleEqual)
}

export function arrayMapCreater<K extends readonly any[], V>() {
  return new EqualsMap<K, V>(arraySimpleEqual)
}