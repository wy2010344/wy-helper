import { Compare, removeWhere } from './equal';

export class EqualsMap<K, V> {
  constructor(public readonly _equals: Compare<K>) {}
  private equals(a: K, b: K) {
    if (a == b) {
      return true;
    }
    return this._equals(a, b);
  }
  private list: {
    key: K;
    value: V;
  }[] = [];

  clear() {
    this.list.length = 0;
  }
  delete(key: K) {
    return !!removeWhere(this.list, x => this.equals(x.key, key));
  }
  forEach(
    callbackfn: (value: V, key: K, map: EqualsMap<K, V>) => void,
    thisArg?: any
  ): void {
    this.list.forEach(({ key, value }) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }
  get(key: K): V | undefined {
    return this.getPair(key)?.value;
  }
  has(key: K) {
    return !!this.getPair(key);
  }

  private getPair(key: K) {
    return this.list.find(v => this.equals(v.key, key));
  }
  set(key: K, value: V): this {
    const pair = this.getPair(key);
    if (pair) {
      pair.value = value;
    } else {
      this.list.push({
        key,
        value,
      });
    }
    return this;
  }

  get size() {
    return this.list.length;
  }
}

export class EqualsSet<K> {
  constructor(public readonly _equals: Compare<K>) {}
  private equals(a: K, b: K) {
    if (a == b) {
      return true;
    }
    return this._equals(a, b);
  }
  private list: K[] = [];

  add(value: K): this {
    const oldIdx = this.getIndex(value);
    if (oldIdx < 0) {
      this.list.push(value);
    }
    return this;
  }

  clear() {
    this.list.length = 0;
  }

  delete(value: K) {
    const oldIdx = this.getIndex(value);
    if (oldIdx < 0) {
      return false;
    }
    this.list.splice(oldIdx, 1);
    return true;
  }

  forEach(
    callbackfn: (value: K, value2: K, set: EqualsSet<K>) => void,
    thisArg?: any
  ): void {
    this.list.forEach(value => {
      callbackfn.call(thisArg, value, value, this);
    });
  }

  has(value: K): boolean {
    return this.getIndex(value) > -1;
  }

  private getIndex(k: K) {
    return this.list.findIndex(v => this.equals(v, k));
  }
  get size() {
    return this.list.length;
  }
}
