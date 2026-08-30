import { getGlobalThis } from '../getGlobalThis';
import { GetValue } from '../setStateHelper';
import {
  emptyArray,
  EmptyFun,
  iterableToList,
  messageChannelCallback,
  numberSortDesc,
  run,
} from '../util';
import { MapGetDep } from './memo';
import { TrackSignal } from './trackSignal';

const m = getGlobalThis() as any;
const DepKey = 'wy-helper-signal-cache';

function createBatch(): CurrentBatch {
  return {
    listeners: new Set(),
    effects: new Map(),
    deps: [],
  };
}
if (!m[DepKey]) {
  const uid = Number.MIN_SAFE_INTEGER;
  const o = {
    batchListeners: new Set(),
    effects: new Map(),
    currentBatch: createBatch(),
    nextBatch: createBatch(),
    state: {
      uid,
      version: uid,
    },
    memoStack: [],
  };
  m[DepKey] = o;
}

type CurrentBatch = {
  listeners: Set<TrackSignal<any>>;
  effects: Map<number, EmptyFun[]>;
  deps: TrackSignal<any>[];
};
interface Version {
  uid: number;
  version: any;
}

export function updateGlobalVersion(v: Version) {
  if (v.uid == Number.MAX_SAFE_INTEGER) {
    v.version = Symbol();
    return;
  }
  v.uid = v.uid + 1;
  v.version = v.uid;
}

export const signalCache = m[DepKey] as {
  currentFun?: TrackSignal<any>;
  //为react而处理
  // currentFunRemove?: boolean;
  //开始了异步任务
  beginBatch?: boolean;
  currentBatch: CurrentBatch;
  nextBatch: CurrentBatch;

  //在更新期间,放置effects
  onWorkBatch?: CurrentBatch;

  currentRelay?: MapGetDep;
  //在执行effect期间
  onEffectRun?: boolean;
  onEffectLevel: number;
  onEffectKeys: number[];
  //是否在注入期间
  state: Version;
  callGet?: boolean;
  memoStack: any[];
};

export function signalOnUpdate() {
  return Boolean(signalCache.onWorkBatch);
}

export function beginCurrentBatch() {
  if (!signalCache.beginBatch) {
    signalCache.beginBatch = true;
    messageCall();
  }
}

export function batchSignalEnd() {
  if (signalCache.onEffectRun) {
    console.log('执行effect中不能batchSignalEnd');
    return;
  }
  if (signalCache.onWorkBatch) {
    console.log('执行listener中不能batchSignalEnd');
    return;
  }

  // 批次执行期间的错误（memo 出入栈不匹配、listener/effect 异常等）代表程序错误，
  // 捕获后批次数据已部分消费、无法恢复一致性，因此不在此吞掉：
  // 由调用方（引擎各事件处理器）独立捕获记录。
  // 这里仅用 finally 还原批次标志，防止异常路径下批次系统永久停摆。
  let c = 0;
  if (signalCache.memoStack.length) {
    console.error(`memo没有正常退出`, ...signalCache.memoStack);
    throw new Error(`之前有memo没有正常退出--${signalCache.memoStack.length}`);
  }
  while (signalCache.beginBatch) {
    //执行观察事件,即trackSignal的两个函数参数,与上游的memo参数
    signalCache.beginBatch = false;
    const currentBatch = signalCache.currentBatch;
    signalCache.currentBatch = signalCache.nextBatch;
    signalCache.nextBatch = currentBatch;
    //交换后
    const { deps, effects, listeners } = currentBatch;
    // 监听器执行期间的错误同样向上传播；onWorkBatch 需要及时还原
    signalCache.onWorkBatch = currentBatch;
    try {
      listeners.forEach(runListener);
      listeners.clear();

      while (deps.length) {
        //因为可能在执行中动态增加,所以使用这个shift的方式
        const fun = deps.shift()!;
        fun.addFun();
      }
    } finally {
      signalCache.onWorkBatch = undefined;
    }
    ///执行effect事件
    // 效果执行期间的错误向上传播；onEffectRun 相关标志需要及时还原
    signalCache.onEffectRun = true;
    const keys = iterableToList(effects.keys()).sort(numberSortDesc);
    signalCache.onEffectKeys = keys;
    try {
      while (keys.length) {
        const key = keys.pop()!;
        signalCache.onEffectLevel = key;
        effects.get(key)?.forEach(run);
      }
      effects.clear();
    } finally {
      signalCache.onEffectRun = false;
      signalCache.onEffectKeys = emptyArray;
      signalCache.onEffectLevel = 0;
    }
    c++;
  }
  // if (c) {
  //   console.log("render", c)
  // }
}
const messageCall = messageChannelCallback(batchSignalEnd);

function runListener(o: TrackSignal<any>) {
  o.addFun();
}

export function addRelay(get: GetValue<any>, value: any) {
  const relay = signalCache.currentRelay;
  if (relay) {
    relay.set(get, value);
  }
}
