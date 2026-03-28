import { StoreRef } from '../storeRef';
import { EmptyFun } from '../util';
import { HookMemo } from './memo';
import { RenderStore } from './renderStore';

export interface IStateHolder {
  firstTime: boolean;
  memos?: RenderStore<HookMemo<any, any>>[];
  memoIndex: number;

  contextIndex: number;
  parentContextIndex: number;

  beginRun(): void;
  endRun(): void;

  children?: Set<IStateHolder>;
}

export interface IEnvModel<M extends IStateHolder = IStateHolder> {
  addDelete(fiber: M): void;
  /**
   * 一些非changeAtom需要生效
   * @param fun
   */
  commitChange(fun: EmptyFun): void;
}

export * from './memo';
export * from './renderForEach';
export * from './renderStore';
