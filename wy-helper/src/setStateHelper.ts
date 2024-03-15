
export type SetStateAction<T> = T | ((v: T) => T)
export type SetValue<F> = (v: F, ...vs: any[]) => void;
export type GetValue<F> = (...vs: any[]) => F;
export type ReduceState<T> = SetValue<SetStateAction<T>>


export function buildSubSet<PARENT, CHILD>(
  parentSet: ReduceState<PARENT>,
  getChild: (s: PARENT) => CHILD,
  buildParent: (s: PARENT, t: CHILD) => PARENT
) {
  return function (setChild: SetStateAction<CHILD>) {
    if (typeof (setChild) == 'function') {
      const call = setChild as (v: CHILD) => CHILD
      parentSet(x => buildParent(x, call(getChild(x))))
    } else {
      parentSet(x => buildParent(x, setChild))
    }
  }
}

export function buildSubSetObject<PARENT, K extends keyof PARENT>(
  parentSet: ReduceState<PARENT>,
  key: K,
  callback?: (v: PARENT[K], parent: PARENT) => PARENT[K]
) {
  return buildSubSet(
    parentSet,
    v => v[key],
    (parent, sub) => {
      return {
        ...parent,
        [key]: callback ? callback(sub, parent) : sub
      }
    }
  )
}



export type ReduceRowState<T> = (() => void) & ((v: SetStateAction<T>) => void)
export function buildSubSetArray<T>(
  parentSet: ReduceState<T[]>,
  equal: ((v: T) => boolean)
): ReduceRowState<T> {
  return function () {
    const isRemove = arguments.length == 0
    const v = arguments[0]
    parentSet(ts => {
      const idx = ts.findIndex(equal)
      if (idx < 0) {
        return ts
      }
      ts = ts.slice()
      if (isRemove) {
        ts.splice(idx, 1)
      } else {
        if (typeof (v) == 'function') {
          ts.splice(idx, 1, v(ts[idx]))
        } else {
          ts.splice(idx, 1, v)
        }
      }
      return ts
    })
  }
}


export function serialEvent<T extends (...args: any[]) => any>(
  ..._vs: (T | undefined | null)[]
): T | undefined {
  const vs = _vs.filter((x) => x) as T[];
  if (vs.length) {
    return function (...args) {
      let out = vs[0](...args);
      for (let i = 1; i < vs.length; i++) {
        const nv = vs[i];
        out = nv(...args);
      }
      return out;
    } as T;
  }
}

export function objectDeepEqual(a: any, b: any, deps = Infinity) {
  if (a == b) {
    //内存相等,或相同的值
    return true;
  }
  if (deps == 0) {
    return
  }
  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      //都是列表
      if (a.length == b.length) {
        for (let i = 0; i < a.length; i++) {
          if (!objectDeepEqual(a[i], b[i], deps - 1)) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    return false;
  }
  if (Array.isArray(b)) {
    return false;
  }
  if (a && b && typeof a == "object" && typeof b == "object") {
    const akeys = Object.keys(a).sort();
    const bkeys = Object.keys(b).sort();
    if (akeys.length == bkeys.length) {
      for (let i = 0; i < akeys.length; i++) {
        const aKey = akeys[i];
        const bkey = bkeys[i];
        if (aKey != bkey) {
          return false;
        }
        if (!objectDeepEqual(a[aKey], b[bkey], deps - 1)) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

export function objectClone<T>(a: T): T {
  if (Array.isArray(a)) {
    return a.map(objectClone) as unknown as T;
  } else if (a && typeof a == "object") {
    const b: any = {};
    for (const key in a) {
      b[key] = objectClone(a[key]);
    }
    return b;
  }
  return a;
}
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 英文字母表
export function numberToLetterBase(number: number) {
  let result = "";
  while (number > 0) {
    const remainder = (number - 1) % letters.length; // 获取余数，范围为 0 到 25
    result = letters[remainder] + result; // 将对应的字母添加到结果字符串的前面
    number = Math.floor((number - 1) / letters.length); // 更新 number
  }
  return result;
}

export function findIndexFrom<T>(
  list: T[],
  predicate: (v: T, i: number) => any,
  from: number
) {
  for (let i = from; i < list.length; i++) {
    const row = list[i];
    if (predicate(row, i)) {
      return i;
    }
  }
  return -1;
}


export function groupToMap<T, F>(list: T[], getKey: (v: T) => F) {
  const map = new Map<F, T[]>()
  for (const row of list) {
    const key = getKey(row)
    const oldDef = map.get(key)
    if (oldDef) {
      oldDef.push(row)
    } else {
      map.set(key, [row])
    }
  }
  return map
}


export function iteratorToList<V>(iterable: IterableIterator<V>) {
  const list: V[] = []
  while (true) {
    const value = iterable.next()
    if (value.done) {
      break
    }
    list.push(value.value)
  }
  return list
}


export function objectMap<M, F>(a: Record<string, M>, fun: (v: M, key: string) => F) {
  const out = {} as any
  for (const key in a) {
    out[key] = fun(a[key], key)
  }
  return out as Record<string, F>
}


export function getOutResolvePromise<T>() {
  let resolve: (v: T) => void
  let reject: (v?: any) => void
  const promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve
    reject = _reject
  })
  return [
    promise,
    resolve!,
    reject!
  ] as const
}
