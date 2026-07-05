import { GetValue } from '../setStateHelper';
import { asLazy } from '../util';

export type ValueOrGet<T> = T | GetValue<T>;
export function getValueOrGet<T>(o: ValueOrGet<T>) {
  if (typeof o == 'function') {
    return (o as GetValue<T>)();
  } else {
    return o;
  }
}
/**
 * 转化成信号
 * @param o
 * @param toMemo
 * @param shouldChange
 * @returns
 */
export function valueOrGetToGet<T>(o: ValueOrGet<T>): GetValue<T> {
  if (typeof o == 'function') {
    return o as any;
  } else {
    return asLazy(o);
  }
}

export { addEffect } from './effect';
export { signalOnUpdate, batchSignalEnd } from './global';
export { type MemoGet, type MemoFun, memo, memoFun } from './memo';
export {
  type OneSetStoreRef,
  createLateSignal,
  createSignal,
  toProxySignal,
} from './signal';
export { type TrackSignalSet, trackSignal, collectSignal } from './trackSignal';
