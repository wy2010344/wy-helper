import { EmptyFun, iterableToList, numberSortAsc, run } from './util';

export function effectsAddLevel(
  effects: Map<number, EmptyFun[]>,
  level: number,
  effect: EmptyFun
) {
  let olds = effects.get(level);
  // 返回"该 level 是否已存在"：新增（原本无）返回 false，已有返回 true
  const has = olds;
  if (!olds) {
    olds = [];
    effects.set(level, olds);
  }
  olds.push(effect);
  return has;
}

export function effectsRunInOrder(effects: Map<number, EmptyFun[]>) {
  const keys = iterableToList(effects.keys()).sort(numberSortAsc);
  for (const key of keys) {
    effects.get(key)?.forEach(run);
  }
}
