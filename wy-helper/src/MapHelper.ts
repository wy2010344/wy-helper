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
