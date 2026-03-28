import { EmptyFun, iterableToList, numberSortAsc, run } from './util';

export function effectsAddLevel(
  effects: Map<number, EmptyFun[]>,
  level: number,
  effect: EmptyFun
) {
  let olds = effects.get(level);
  if (!olds) {
    olds = [];
    effects.set(level, olds);
  }
  olds.push(effect);
  return !olds;
}

export function effectsRunInOrder(effects: Map<number, EmptyFun[]>) {
  const keys = iterableToList(effects.keys()).sort(numberSortAsc);
  for (const key of keys) {
    effects.get(key)?.forEach(run);
  }
}
