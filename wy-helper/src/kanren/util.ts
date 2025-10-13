import { SetValue } from '../setStateHelper';
import { EmptyFun, emptyObject } from '../util';

export class KPair<L, R> {
  private constructor(
    public readonly left: L,
    public readonly right: R
  ) {}
  public static of<L, R>(left: L, right: R) {
    return new KPair(left, right);
  }
}
export function pair<L, R>(a: L, b: R) {
  return KPair.of(a, b);
}
export class KVar {
  static UID = 0;
  private constructor(public readonly flag: string = `_${KVar.UID++}`) {}
  toString() {
    return `{${this.flag}}`;
  }
  equals(v: any) {
    return v == this || (v instanceof KVar && v.flag == this.flag);
  }
  static create() {
    return new KVar();
  }
}

/**
 * 只需要扩展KEqual,列表都用Pair去模拟而不是js的Array,js的Array无递归友好性.
 * 即只需要扩展原子
 */
export abstract class KEqual {
  abstract equals(b: any): any;
}
/**所有类型 */
export type KType =
  | KVar
  | KPair<KType, KType>
  | string
  | number
  | null
  | KEqual;
export type List<T> = KPair<T, List<T>> | null;
type KVPair = KPair<KVar, KType>;
/**
 * 作用域链表,key为KVar,value变具体类型,或仍为KVar
 */
export type KSubsitution = List<KVPair>;

/**
 * 在作用域中寻找变量的定义
 * @param v 变量
 * @param sub 作用域
 */
export function findVarDefine<V>(
  v: KVar,
  sub: List<KPair<KVar, V>>
): KPair<KVar, V> | null {
  while (sub != null) {
    const kv = sub.left;
    const theV = kv.left;
    if (v.equals(theV)) {
      return kv;
    }
    sub = sub.right;
  }
  return null;
}

export function walk(v: KType, sub: KSubsitution): KType {
  if (v instanceof KVar) {
    const val = findVarDefine(v, sub);
    if (val) {
      //如果找到定义,对定义递归寻找
      return walk(val.right, sub);
    }
    return v;
  } else if (v instanceof KPair) {
    return KPair.of(walk(v.left, sub), walk(v.right, sub));
  } else {
    return v;
  }
}
export function extendSubsitution<K, V>(
  key: K,
  value: V,
  parent: List<KPair<K, V>>
) {
  return KPair.of(KPair.of(key, value), parent);
}

export function baseUnify(
  a: KType,
  b: KType,
  sub: KSubsitution
): [boolean, KSubsitution] {
  a = walk(a, sub);
  b = walk(b, sub);
  if (a == b) {
    return [true, sub];
  }
  if (a instanceof KEqual) {
    if (a.equals(b)) {
      return [true, sub];
    }
  }
  if (b instanceof KEqual) {
    if (b.equals(a)) {
      return [true, sub];
    }
  }
  if (a instanceof KVar) {
    if (a.equals(b)) {
      return [true, sub];
    }
    return [true, extendSubsitution(a, b, sub)];
  }
  if (b instanceof KVar) {
    if (b.equals(a)) {
      return [true, sub];
    }
    return [true, extendSubsitution(b, a, sub)];
  }
  if (a instanceof KPair && b instanceof KPair) {
    const [success, leftSub] = baseUnify(a.left, b.left, sub);
    if (success) {
      return baseUnify(a.right, b.right, leftSub);
    }
  }
  return [false, null];
}

export function list<T>(...vs: T[]) {
  return toPairs(vs, null) as List<T>;
}

export function toPairs<T, F>(vs: T[], end: F) {
  const lastIndex = vs.length - 1;
  type RetType = F | T | KPair<T, RetType>;
  let ret: RetType = end;
  for (let i = lastIndex; i > -1; i--) {
    ret = KPair.of(vs[i], ret);
  }
  return ret;
}

export function toArray(v: KType): [KType[], KType] {
  const list: KType[] = [];
  while (v instanceof KPair) {
    list.push(v.left);
    v = v.right;
  }
  return [list, v] as const;
}

export function getVarFromMap(map: Map<string, KVar>, key: string) {
  if (key == '_') {
    return KVar.create();
  }
  let oldVar = map.get(key);
  if (!oldVar) {
    oldVar = KVar.create();
    map.set(key, oldVar);
  }
  return oldVar;
}

function collectVar(v: any, set: Set<KVar>) {
  if (v instanceof KVar) {
    set.add(v);
  } else if (v instanceof Array) {
    v.forEach(row => collectVar(row, set));
  } else if (v instanceof KPair) {
    collectVar(v.left, set);
    collectVar(v.right, set);
  } else if (v && typeof v == 'object') {
    for (const key in v) {
      collectVar(v[key], set);
    }
  }
}
export class MergeSub {
  constructor(vs: any) {
    collectVar(vs, this.set);
  }
  readonly set = new Set<KVar>();
  changeSub(outSub: KSubsitution, newSub: KSubsitution = null) {
    this.set.forEach(value => {
      const toValue = walk(value, outSub);
      if (!value.equals(toValue)) {
        newSub = extendSubsitution(value, toValue, newSub);
      }
    });
    return newSub;
  }
}

export function getVarRecord(map: Map<string, KVar>) {
  return new Proxy(emptyObject, {
    get(target, p, receiver) {
      return getVarFromMap(map, p as any);
    },
  });
}

export type VarV = Readonly<Record<string, KVar>>;
export function withVar<T>(fun: (v: VarV) => T, map = new Map<string, KVar>()) {
  const V = getVarRecord(map);
  return fun(V);
}
