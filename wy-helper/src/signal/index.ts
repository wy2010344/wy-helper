import { GetValue } from '../setStateHelper';
import { asLazy } from '../util';

export type ValueOrGet<T, This = void, Args extends any[] = []> =
  | T
  | GetValue<T, This, Args>;

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
 * @param def
 * @returns
 */
export function valueOrGetToGet<T, This = void, Args extends any[] = []>(
  o: ValueOrGet<T, This, Args> | undefined,
  def: GetValue<T, This, Args> = () => o as any
): GetValue<T, This, Args> {
  const to = typeof o;
  if (to == 'function') {
    return o as any;
  }
  if (to == 'undefined') {
    return def;
  }
  return () => o as any;
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
