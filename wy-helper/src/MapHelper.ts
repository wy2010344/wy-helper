import { arrayReduceLeft } from './equal';
import { ReadArray, ReadMap, ReadSet } from './util';

export class MapHelper<K, V> {
  private dirty = false;
  private map: Map<K, V>;
  constructor(_map: ReadMap<K, V>) {
    this.map = _map as Map<K, V>;
  }
  reset(v: ReadMap<K, V>) {
    this.map = v as Map<K, V>;
    this.dirty = false;
  }
  get(): ReadMap<K, V> {
    return this.map;
  }
  private safeCopy() {
    if (!this.dirty) {
      this.dirty = true;
      this.map = new Map(this.map);
    }
  }
  isDirty() {
    return this.dirty;
  }

  delete(key: K) {
    if (this.map.has(key)) {
      this.safeCopy();
      return this.map.delete(key);
    }
    return false;
  }

  set(key: K, value: V) {
    const old = this.map.get(key);
    if (old === value) {
      return false;
    }
    this.safeCopy();
    this.map.set(key, value);
    return true;
  }

  has(key: K) {
    return this.map.has(key);
  }
}

export class SetHelper<K> {
  private dirty = false;
  private set: Set<K>;
  constructor(_set: ReadSet<K>) {
    this.set = _set as Set<K>;
  }
  reset(v: ReadSet<K>) {
    this.set = v as Set<K>;
    this.dirty = false;
  }
  get(): ReadSet<K> {
    return this.set;
  }

  private safeCopy() {
    if (!this.dirty) {
      this.dirty = true;
      this.set = new Set(this.set);
    }
  }
  delete(key: K) {
    if (this.set.has(key)) {
      this.safeCopy();
      return this.set.delete(key);
    }
    return false;
  }

  add(key: K) {
    if (this.set.has(key)) {
      return false;
    }
    this.safeCopy();
    this.set.add(key);
    return true;
  }

  has(key: K) {
    return this.set.has(key);
  }
}

export function listToMap<N, K, V>(
  list: ReadArray<N>,
  fun: (n: N, map: Map<K, V>) => void
) {
  const map = new Map<K, V>();
  for (let i = 0; i < list.length; i++) {
    fun(list[i], map);
  }
  return map;
}

export function mapToList<K, V, N>(
  a: ReadMap<K, V>,
  fun: (v: V, k: K, list: N[]) => void
) {
  const list: N[] = [];
  a.forEach(function (v, k) {
    fun(v, k, list);
  });
  return list;
}

export function setToList<K, N>(a: ReadSet<K>, fun: (k: K, list: N[]) => N) {
  const list: N[] = [];
  a.forEach(function (v) {
    fun(v, list);
  });
  return list;
}

export function mapEvery<K, V>(a: ReadMap<K, V>, fun: (v: V, k: K) => boolean) {
  let ret = true;
  a.forEach(function (v, k) {
    ret = ret && fun(v, k);
  });
  return ret;
}

export function mapSome<K, V>(a: ReadMap<K, V>, fun: (v: V, k: K) => boolean) {
  let ret = false;
  a.forEach(function (v, k) {
    ret = ret || fun(v, k);
  });
  return ret;
}

export function setEvery<K>(a: ReadSet<K>, fun: (k: K) => boolean) {
  let ret = true;
  a.forEach(function (k) {
    ret = ret && fun(k);
  });
  return ret;
}

export function setSome<K>(a: ReadSet<K>, fun: (k: K) => boolean) {
  let ret = true;
  a.forEach(function (k) {
    ret = ret || fun(k);
  });
  return ret;
}

export function setEqual<T>(a: Set<T>, b: Set<T>) {
  if (a.size != b.size) {
    return false;
  }
  let ret = true;
  a.forEach(v => {
    if (!ret) {
      return;
    }
    ret = ret && b.has(v);
  });
  return ret;
}

/**
 * 基于有序数组 + 二分查找的 Map<number, V>
 * 插入/删除 O(n)，查找 O(log n)，遍历有序
 */
export class SortMap<V> {
  private _keys: number[] = [];
  private _vals: V[] = [];

  /** 元素个数 */
  public get size(): number {
    return this._keys.length;
  }

  /** 二分查找，返回索引；找不到返回 -(插入点+1) */
  private _binarySearch(key: number): number {
    let low = 0;
    let high = this._keys.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const mk = this._keys[mid];
      if (mk === key) return mid;
      if (mk < key) low = mid + 1;
      else high = mid - 1;
    }
    return -(low + 1); // 标准库风格
  }

  /** 查询 */
  public get(key: number): V | undefined {
    const idx = this._binarySearch(key);
    if (idx < 0) {
      return;
    }
    return this._vals[idx];
  }

  getOrCreate(key: number, create: (n: number) => V) {
    const idx = this._binarySearch(key);
    if (idx < 0) {
      const tidx = -idx - 1;
      const v = create(tidx);
      this._keys.splice(tidx, 0, key);
      this._vals.splice(tidx, 0, v);
      return v;
    }
    return this._vals[idx];
  }

  /** 插入或更新 */
  public set(key: number, value: V): this {
    const idx = this._binarySearch(key);
    if (idx >= 0) {
      // 已存在，覆盖
      this._vals[idx] = value;
    } else {
      // 新插入，保持有序
      const insertAt = -idx - 1;
      this._keys.splice(insertAt, 0, key);
      this._vals.splice(insertAt, 0, value);
    }
    return this;
  }

  /** 删除 */
  public delete(key: number): boolean {
    const idx = this._binarySearch(key);
    if (idx >= 0) {
      this._keys.splice(idx, 1);
      this._vals.splice(idx, 1);
      return true;
    }
    return false;
  }

  /** 有序遍历 (key, value) */
  public forEach(callback: (value: V, key: number) => void): void {
    for (let i = 0; i < this._keys.length; i++) {
      callback(this._vals[i], this._keys[i]);
    }
  }

  /** 清空 */
  public clear(): void {
    this._keys.length = 0;
    this._vals.length = 0;
  }
}
