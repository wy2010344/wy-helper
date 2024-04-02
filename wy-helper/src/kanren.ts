
// export class KPair<L, R>{
//   private constructor(
//     public readonly left: L,
//     public readonly right: R
//   ) { }
//   public static of<L, R>(left: L, right: R) {
//     return new KPair(left, right)
//   }
// }

export type KPair<L, R> = [L, R]
export function getKPairLeft<L, R>(p: KPair<L, R>) {
  return p[0]
}
export function getKPairRight<L, R>(p: KPair<L, R>) {
  return p[1]
}
export function createKPair<L, R>(l: L, r: R): KPair<L, R> {
  return [l, r]
}
export function isKPair(v: KType): v is KPair<KType, KType> {
  return Array.isArray(v) && v.length == 2
}
/**
 * 平行可能行->所有作用域
 * 不同的世界线。没有，或有一个，但后继是空。
 * 是一种或匹配关系
 */
export type DelayStream<V> = () => Stream<V>
export type Stream<V> = null | KPair<V, DelayStream<V>>
export const emptyDelayStream: DelayStream<any> = () => null
/**
 * 增加世界线b
 * 在a流查找后（包括a的所有后继），在b的流继续查找
 * @param a 
 * @param b 
 */
export function streamAppendStream<V>(a: Stream<V>, b: DelayStream<V>): Stream<V> {
  if (a == null) {
    return b()
  } else {
    //如果a有后继，追加到后继之后
    return createKPair(getKPairLeft(a), function () {
      return streamAppendStream(getKPairRight(a)(), b)
    })
  }
}
/**
 * 求解目标，代入作用域在不同世界线上求解。
 * 作用域在同一世界线上是叠加的。
 */
export type Goal<V> = (sub: V) => Stream<V>
/**
 * 为所有的世界线应用一个条件，变换成新的世界线列表
 * 在a流中，使用b目标查找，每一个节点的尝试
 * 用于and语句。
 * @param a 
 * @param b 
 */
export function streamBindGoal<V>(a: Stream<V>, b: Goal<V>): Stream<V> {
  if (a == null) {
    return null
  } else {
    //如果a有后继流，则递归处理
    return streamAppendStream(b(getKPairLeft(a)), function () {
      return streamBindGoal(getKPairRight(a)(), b)
    })
  }
}
export class KVar {
  static UID = 0
  constructor(public readonly flag: string = `_${KVar.UID++}`) { }
  toString() {
    return `{${this.flag}}`
  }
  equals(v: any) {
    return v == this || (v instanceof KVar && v.flag == this.flag)
  }
}

export interface KEqual {
  equals(v: any): any
}
/**所有类型 */
export type KType = KVar | [KType, KType] | string | number | null | KEqual
export type List<T> = [T, List<T>] | null
type KVPair = KPair<KVar, KType>
/**
 * 作用域链表,key为KVar,value变具体类型,或仍为KVar
 */
export type KSubsitution = List<KVPair>
/**
 * 在作用域中寻找变量的定义
 * @param v 变量
 * @param sub 作用域
 */
export function findVarDefine(v: KVar, sub: KSubsitution): KVPair | null {
  while (sub != null) {
    const kv = getKPairLeft(sub)
    const theV = getKPairLeft(kv)
    if (theV == v || v.equals(theV)) {
      return kv
    }
    sub = getKPairRight(sub)
  }
  return null
}

export function walk(v: KType, sub: KSubsitution): KType {
  if (v instanceof KVar) {
    const val = findVarDefine(v, sub)
    if (val) {
      //如果找到定义,对定义递归寻找
      return walk(getKPairRight(val), sub)
    }
    return v
  } else if (isKPair(v)) {
    return createKPair(walk(getKPairLeft(v), sub), walk(getKPairRight(v), sub))
  } else {
    return v
  }
}
export function extendSubsitution<K, V>(
  key: K,
  value: V,
  parent: List<KPair<K, V>>
) {
  return createKPair(createKPair(key, value), parent)
}
export function unify(a: KType, b: KType, sub: KSubsitution): [boolean, KSubsitution] {
  a = walk(a, sub)
  b = walk(b, sub)
  if (a == b) {
    return [true, sub]
  }
  if (a instanceof KVar) {
    if (a.equals(b)) {
      return [true, sub]
    }
    return [true, extendSubsitution(a, b, sub)]
  }
  if (b instanceof KVar) {
    if (b.equals(a)) {
      return [true, sub]
    }
    return [true, extendSubsitution(b, a, sub)]
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
    let i = 0
    let beforeSub = sub
    while (i < a.length) {
      const [success, leftSub] = unify(a[i], b[i], beforeSub)
      if (success) {
        beforeSub = leftSub
        i++
      } else {
        return [false, null]
      }
    }
    return [true, beforeSub]
  }
  if (a && typeof a == 'object' && 'equals' in a) {
    if (a.equals(b)) {
      return [true, sub]
    }
  }
  if (b && typeof b == 'object' && 'equals' in b) {
    if (b.equals(a)) {
      return [true, sub]
    }
  }
  return [false, null]
}


export const kanren = {
  fresh() {
    return new KVar()
  },
  fail: <Goal<any>>function () {
    return null
  },
  success: <Goal<any>>function (sub) {
    return createKPair(sub, emptyDelayStream)
  },
  toUnify(sub: KSubsitution, a: KType, b: KType): Stream<KSubsitution> {
    const [success, sub1] = unify(a, b, sub)
    if (success) {
      return kanren.success(sub1)
    }
    return kanren.fail(sub1)
  },
  toOr<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    return streamAppendStream(a(sub), function () {
      return b(sub)
    })
  },
  toAnd<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    return streamBindGoal(a(sub), b)
  },
  toCut<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    const subs = a(sub)
    if (subs) {
      //舍弃别的世界线
      return b(getKPairLeft(subs))
    }
    return subs
  },
  or<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toOr(sub, a, b)
    }
  },
  cut<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toCut(sub, a, b)
    }
  },
  and<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toAnd(sub, a, b)
    }
  },
  unify(a: KType, b: KType): Goal<KSubsitution> {
    return function (sub) {
      return kanren.toUnify(sub, a, b)
    }
  }
}

export function toList<T>(vs: T[]) {
  return toPairs(vs, null) as List<T>
}

export function toPairs<T, F>(vs: T[], end: F) {
  const lastIndex = vs.length - 1
  type RetType = F | T | [T, RetType]
  let ret: RetType = end
  for (let i = lastIndex; i > -1; i--) {
    ret = createKPair(vs[i], ret)
  }
  return ret
}