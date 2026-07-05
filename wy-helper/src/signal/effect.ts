import { effectsAddLevel } from '../effectLevel';
import { EmptyFun } from '../util';
import { beginCurrentBatch, signalCache } from './global';

/**
 * 向最近的effect添加
 * @param effect
 * @param level
 */
export function addEffect(effect: EmptyFun, level = 0) {
  if (signalCache.onEffectRun && level > signalCache.onEffectLevel) {
    //可在当前区间插入
    const has = effectsAddLevel(signalCache.nextBatch.effects, level, effect);
    if (!has) {
      //需要补充keys
      const keys = signalCache.onEffectKeys;
      const idx = keys.findIndex(x => x < level);
      if (idx < 0) {
        keys.push(level);
      } else {
        keys.splice(idx, 0, level);
      }
    }
  } else {
    let effects: Map<number, EmptyFun[]>;
    if (signalCache.onWorkBatch) {
      effects = signalCache.onWorkBatch.effects;
    } else {
      beginCurrentBatch();
      effects = signalCache.currentBatch!.effects;
    }
    effectsAddLevel(effects, level, effect);
  }
}
