import { GetValue, SetValue } from '../setStateHelper';
import { emptyFun } from '../util';
import { addRelay, signalCache } from './global';
export type MapGetDep = Map<GetValue<any>, any>;
export interface MemoGet<T> {
  (old: undefined, inited: false): T;
  (old: T, inited: true): T;
}

export interface MemoFun<T> {
  (): T;
  memorized: true;
  afters: SetValue<T>[];
}
function mapInject(value: any, key: GetValue<any>) {
  key();
}

function relayChange(relays: MapGetDep) {
  for (const [get, old] of relays) {
    //这里负责着注入
    const v = get();
    if (v != old) {
      return true;
    }
  }
  return false;
}

function memoGet<T>(
  relays: MapGetDep,
  get: GetValue<T>,
  lastValue: T,
  init: boolean
) {
  relays.clear();
  signalCache.currentRelay = relays;
  const v = get(lastValue, init);
  return v;
}

function checkEnter(memo: any) {
  if (signalCache.memoStack.includes(memo)) {
    throw new Error('循环调用memo');
  }
  signalCache.memoStack.push(memo);
}
function checkLeave(memo: any) {
  const last = signalCache.memoStack.pop();
  if (last != memo) {
    throw new Error('进出必须成对存在');
  }
}
export function memo<T>(get: MemoGet<T> | MemoFun<T>, after?: SetValue<T>) {
  const target = get as any;
  if (target.memorized) {
    //减少不必要的声明
    if (after && after != emptyFun) {
      const afters = target.afters;
      if (!afters.include(after)) {
        afters.push(after);
      }
    }
    return get as MemoFun<T>;
  }
  const relays = new Map<GetValue<any>, any>() as MapGetDep;
  let lastValue!: T;
  let inited = false;
  let stateVersion: any = relays;
  let listenerVersion: any = undefined;
  const afters: SetValue<T>[] = [];
  if (after && after != emptyFun) {
    afters.push(after);
  }
  const myGet = function () {
    checkEnter(myGet);
    signalCache.callGet = true;
    //每一次都不能跳过,主要是trackSignal需要流入依赖
    if (stateVersion == signalCache.state.version) {
      const currentFun = signalCache.currentFun;
      if (currentFun && listenerVersion != currentFun) {
        //在依赖注入期间
        listenerVersion = currentFun;
        relays.forEach(mapInject);
      }
      addRelay(myGet, lastValue);
      checkLeave(myGet);
      return lastValue;
    }
    //这里一定要重置
    listenerVersion = undefined;
    stateVersion = signalCache.state.version;

    let shouldAfter = false;
    const oldRelay = signalCache.currentRelay;
    signalCache.currentRelay = undefined;
    if (inited) {
      //这个relayChange,会检查上游的更新
      if (relayChange(relays)) {
        const value = memoGet(relays, get, lastValue, inited);
        if (value != lastValue) {
          lastValue = value;
          shouldAfter = true;
        }
      }
    } else {
      lastValue = memoGet(relays, get, lastValue, inited);
      inited = true;
      shouldAfter = true;
    }
    signalCache.currentRelay = oldRelay;
    addRelay(myGet, lastValue);
    //必须放在前面
    checkLeave(myGet);
    if (shouldAfter) {
      //是需要控制每次函数执行后执行,还是每次结果不同才执行?
      afters.forEach(after => after(lastValue));
    }
    return lastValue;
  } as MemoFun<T>;
  myGet.memorized = true;
  myGet.afters = afters;
  (myGet as any).get = get;
  return myGet;
}

export function memoFun<T extends Function>(
  get: MemoGet<T> | MemoFun<T>,
  after: SetValue<T> = emptyFun
): T {
  const value = memo(get, after) as any;
  if (!value.memoFun) {
    value.memoFun = function () {
      return value().apply(null, arguments);
    } as any;
  }
  return value.memoFun as any;
}
