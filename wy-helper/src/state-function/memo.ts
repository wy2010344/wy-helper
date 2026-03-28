import { IEnvModel, IStateHolder } from '.';
import { arrayNotEqualOrOne } from '../equal';
import { GetValue } from '../setStateHelper';
import { storeRef, StoreRef } from '../storeRef';
import { emptyArray, quote } from '../util';
import { RenderStore } from './renderStore';
export type HookMemo<T, D> = {
  shouldChange(a: D, b: D): any;
  deps: D;
  value: T;
};

export type MemoEvent<V, D = any> =
  | {
      trigger: D;
      isInit: false;
      beforeValue: V;
      beforeTrigger: D;
    }
  | {
      trigger: D;
      isInit: true;
      beforeValue?: never;
      beforeTrigger?: never;
    };
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect
 * @param deps
 * @returns
 */
export function createUseBaseMemo(
  hookStateHoder: GetValue<IStateHolder>,
  hookEnvModel: GetValue<IEnvModel>
) {
  return function <V, D>(
    shouldChange: (a: D, b: D) => any,
    effect: (e: MemoEvent<V, D>) => V,
    deps: D
  ): V {
    const holder = hookStateHoder();
    const env = hookEnvModel();
    if (holder.firstTime) {
      const hookMemos = holder.memos || [];
      holder.memos = hookMemos;
      const state: HookMemo<V, D> = {
        value: effect({
          trigger: deps,
          isInit: true,
        }),
        deps,
        shouldChange,
      };
      const hook = new RenderStore(state);
      hookMemos.push(hook);
      return state.value;
    } else {
      const hookMemos = holder.memos;
      if (!hookMemos) {
        throw new Error('原组件上不存在memos');
      }
      const index = holder.memoIndex;
      const hook = hookMemos[index];
      if (!hook) {
        throw new Error('出现了更多的memo');
      }
      const state = hook.get(env);
      holder.memoIndex = index + 1;
      if (state.shouldChange(state.deps, deps)) {
        //不处理
        const newState: HookMemo<V, D> = {
          value: effect({
            trigger: deps,
            isInit: false,
            beforeTrigger: state.deps,
            beforeValue: state.value,
          }),
          deps,
          shouldChange,
        };
        hook.set(env, newState);
        return newState.value;
      }
      return state.value;
    }
  };
}

export type MemoEffectSelf<T> = (e: MemoEvent<T, MemoEffectSelf<T>>) => T;
export function createUseMemoHelper(
  useBaseMemo: ReturnType<typeof createUseBaseMemo>
) {
  function useMemo<V, D>(effect: (e: MemoEvent<V, D>) => V, deps: D): V;
  function useMemo<T>(effect: (e: MemoEffectSelf<T>) => T): T;
  function useMemo(effect: any) {
    const dep = arguments.length == 1 ? effect : arguments[1];
    return useBaseMemo(arrayNotEqualOrOne, effect, dep);
  }
  /**
   * 比如signal使用
   * @param v
   * @returns
   */
  function useConst<T>(v: T) {
    return useMemo(() => v, emptyArray);
  }

  /**
   * 构造一次性
   * @param creater
   * @param vs
   * @returns
   */
  function useConstFrom<F, Arg extends readonly any[] = readonly any[]>(
    creater: (...vs: Arg) => F,
    ...vs: Arg
  ) {
    return useMemo(() => {
      return creater(...vs);
    }, emptyArray);
  }
  /**
   * 其实就是useCallback
   * @param v
   * @param dep
   * @returns
   */
  function useConstDep<T>(v: T, dep?: any) {
    return useMemo(() => v, dep);
  }

  /**
   * 如果rollback,不允许改变是持久的
   * 但是ref本质上就是持久的
   * 返回的是对象
   * @param init
   * @returns
   */
  function useAtomBind<M, T>(init: M, trans: (m: M) => T): StoreRef<T>;
  function useAtomBind<T>(init: T): StoreRef<T>;
  function useAtomBind() {
    const [init, oldTrans] = arguments;
    return useMemo(() => {
      const trans = oldTrans || quote;
      const ref = storeRef(trans(init));
      ref.get = ref.get.bind(ref);
      ref.set = ref.set.bind(ref);
      return ref;
    }, emptyArray);
  }
  function useAtomBindFun<T>(init: () => T) {
    return useAtomBind(undefined, init);
  }

  function useAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>;
  function useAtom<T>(init: T): StoreRef<T>;
  function useAtom() {
    const [init, oldTrans] = arguments;
    return useMemo(() => {
      const trans = oldTrans || quote;
      return storeRef(trans(init));
    }, emptyArray);
  }
  function useAtomFun<T>(init: () => T) {
    return useAtom(undefined, init);
  }

  function createRef<T>(v: T) {
    return {
      current: v,
    };
  }
  function useRef<T>(): {
    current: T | undefined;
  };
  function useRef<T>(init: T): {
    current: T;
  };
  function useRef<T>(init: null): {
    current: T | null;
  };
  function useRef() {
    return useConstFrom(createRef, arguments[0]);
  }
  function useRefFrom<F, Arg extends readonly any[] = readonly any[]>(
    creater: (...vs: Arg) => F,
    ...vs: Arg
  ) {
    return useMemo(() => {
      return {
        current: creater(...vs),
      };
    }, emptyArray);
  }

  function createLaterGet<T>() {
    const ref = storeRef<T | undefined>(undefined);
    ref.get = ref.get.bind(ref);
    return ref;
  }

  function useLaterSetGet<T>() {
    return useMemo(createLaterGet, emptyArray) as StoreRef<T>;
  }
  /**
   * 始终获得render上的最新值
   * 由于useMemoGet的特性,返回的自动就是一个hook上的最新值
   * @param init
   * @returns
   */
  function useAlaways<T>(init: T) {
    const ref = useLaterSetGet<T>();
    ref.set(init);
    return ref.get as GetValue<T>;
  }

  function useRefConstWith<T>(v: T) {
    return useAtom(v).get();
  }

  function useMemoVersion(...deps: any[]) {
    return useMemo(triggerAdd, deps);
  }

  function triggerAdd(e: MemoEvent<number, any>) {
    return (e.beforeValue || 0) + 1;
  }

  return {
    useMemo,
    useConst,
    useConstFrom,
    useConstDep,
    useAtomBind,
    useAtomBindFun,
    useAtom,
    useAtomFun,
    useRef,
    useRefFrom,
    useLaterSetGet,
    useAlaways,
    useRefConstWith,
    useMemoVersion,
  };
}
