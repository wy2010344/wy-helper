export class KVPair<T> {
  constructor(
    public readonly key: string,
    public readonly value: T,
    public readonly rest?: KVPair<T>
  ) {}
  get(key: string): KVPair<T> | undefined {
    if (this.key == key) {
      return this;
    }
    let rest = this.rest;
    while (rest) {
      if (rest.key == key) {
        return rest;
      }
      rest = rest.rest;
    }
  }
  /**
   * 增加,如果现有,则删除现有
   * @param key
   * @param value
   * @returns
   */
  add(key: string, value: T) {
    return new KVPair(key, value, this.remove(key));
  }

  addAll(vs: KVPair<T>) {
    let ret: KVPair<T> = this;
    vs.forEach((key, value) => {
      ret = this.add(key, value);
    });
    return ret;
  }

  forEach(callback: (key: string, value: T) => void) {
    let temp: KVPair<T> | undefined = this;
    while (temp) {
      callback(temp.key, temp.value);
      temp = temp.rest;
    }
  }
  /**
   * 删除现有
   * @param key
   * @returns
   */
  remove(key: string) {
    if (this.get(key)) {
      let n: KVPair<T> | undefined = undefined;
      let x: KVPair<T> | undefined = this;
      while (x) {
        if (x.key != key) {
          n = new KVPair(x.key, x.value, n);
        }
        x = x.rest;
      }
      return n;
    }
    return this;
  }
  toObject() {
    const o: Record<string, T> = {};
    let x: KVPair<any> | undefined = this;
    while (x) {
      if (o[x.key]) {
        console.warn(`已经存在相应的key${x.key}`);
      } else {
        o[x.key] = x.value;
      }
      x = x.rest;
    }
    return o;
  }
  static fromObject<T>(v: Record<string, T>) {
    let ret: KVPair<T> | undefined = undefined;
    for (const key in v) {
      ret = new KVPair(key, v[key], ret);
    }
    return ret!;
  }
}

export function kvPair<T>(key: string, value: T, parent?: KVPair<T>) {
  return new KVPair(key, value, parent);
}
