import { arrayEqual, simpleEqual } from './equal';
import { EqualsMap } from './EqualsMap';
import { ReadArray } from './util';

export interface RMap<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  forEach(fun: (value: V, key: K) => void): void;

  has(key: K): boolean;
  readonly size: number;
}

export interface RWMap<K, V> extends RMap<K, V> {
  delete(key: K): boolean;
}

function orArrayEqual(a: any, b: any) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayEqual(a, b, simpleEqual);
  }
}

export function arrayOrOneMapCreater<K, V>() {
  return new EqualsMap<K, V>(orArrayEqual);
}

export function normalMapCreater<K, V>() {
  return new Map<K, V>();
}

export function arraySimpleEqual<T>(a: ReadArray<T>, b: ReadArray<T>) {
  return arrayEqual(a, b, simpleEqual);
}

export function arraySimpleNotEqual<T>(a: ReadArray<T>, b: ReadArray<T>) {
  return !arrayEqual(a, b, simpleEqual);
}

export function arrayMapCreater<K extends readonly any[], V>() {
  return new EqualsMap<K, V>(arraySimpleEqual);
}
