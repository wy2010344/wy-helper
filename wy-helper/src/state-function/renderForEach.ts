import { BaseRMap, EmptyFun, GetValue, SetValue, StoreRef } from 'wy-helper';
import { IEnvModel, IStateHolder } from '.';

export interface RMapCreater<K, V> {
  (): BaseRMap<K, V>;
}
export function normalMapCreater<K, V>() {
  return new Map<K, V>();
}

export function cloneMap<K, T>(
  map: BaseRMap<K, T[]>,
  creater: RMapCreater<K, T[]>
) {
  const newMap = creater();
  map.forEach(function (v, k) {
    newMap.set(k, v.slice());
  });
  return newMap;
}
export function createRenderForEach<T extends IStateHolder>(
  hookStateHoder: GetValue<T>,
  hookEnvModel: GetValue<IEnvModel>,
  createHolder: (p: T) => T,
  createMemo: <M>(creater: () => M) => StoreRef<M>
) {
  /**
   * 因为是同步的,且js有副作用,在运行时自己去累计,不过度设计
   * @param forEach
   * @param render
   */
  return function <K, Z = void, M = void>(
    forEach: (callback: (key: K, render: (v: K) => Z) => Z) => M,
    createMap: RMapCreater<K, IStateHolder[]> = normalMapCreater
  ) {
    const mapRef = createMemo(createMap); //useBaseMemo(alawaysFalse, createMapRef, createMap);
    const oldMap = cloneMap(mapRef.get(), createMap);
    const newMap = createMap();
    const beforeHolder = hookStateHoder();
    const envModel = hookEnvModel();
    const thisTimeAdd: IStateHolder[] = [];
    const out = forEach((key, render) => {
      const envs = oldMap.get(key);
      let holder: IStateHolder;
      if (envs?.length) {
        holder = envs.shift()!;
        if (holder.parentContextIndex != beforeHolder.contextIndex) {
          throw 'parentContext位置改变!!';
        }
      } else {
        holder = createHolder(beforeHolder);
        thisTimeAdd.push(holder);
      }
      holder.beginRun();
      const z = render(key);
      holder.endRun();
      let newEnvs = newMap.get(key);
      if (newEnvs) {
        newEnvs.push(holder);
        console.warn(`重复的key[${key}]出现第${newEnvs.length}次`);
      } else {
        newEnvs = [holder];
      }
      newMap.set(key, newEnvs);
      return z;
    });

    oldMap.forEach(function (values) {
      values.forEach(value => {
        envModel.addDelete(value);
      });
    });
    envModel.commitChange(function () {
      //考虑useEffect双次执行，似乎不受影响
      mapRef.set(newMap);
      beforeHolder.children = beforeHolder.children || new Set();
      const children = beforeHolder.children;
      thisTimeAdd.forEach(env => {
        children.add(env);
      });
      oldMap.forEach(function (values) {
        values.forEach(value => {
          children.delete(value);
        });
      });
    });
    return out;
  };
}
