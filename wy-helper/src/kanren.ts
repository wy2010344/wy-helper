import { SetValue } from "./setStateHelper"
import { EmptyFun, emptyObject } from "./util"

export class KPair<L, R> {
  private constructor(
    public readonly left: L,
    public readonly right: R
  ) { }
  public static of<L, R>(left: L, right: R) {
    return new KPair(left, right)
  }
}
export function pair<L, R>(a: L, b: R) {
  return KPair.of(a, b)
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
    return KPair.of(a.left, function () {
      return streamAppendStream(a.right(), b)
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
    return streamAppendStream(b(a.left), function () {
      return streamBindGoal(a.right(), b)
    })
  }
}
export class KVar {
  static UID = 0
  private constructor(public readonly flag: string = `_${KVar.UID++}`) { }
  toString() {
    return `{${this.flag}}`
  }
  equals(v: any) {
    return v == this || (v instanceof KVar && v.flag == this.flag)
  }
  static create() {
    return new KVar()
  }
}

/**
 * 只需要扩展KEqual,列表都用Pair去模拟而不是js的Array,js的Array无递归友好性.
 * 即只需要扩展原子
 */
export abstract class KEqual {
  abstract equals(b: any): any
}
/**所有类型 */
export type KType = KVar | KPair<KType, KType> | string | number | null | KEqual
export type List<T> = KPair<T, List<T>> | null
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
export function findVarDefine<V>(v: KVar, sub: List<KPair<KVar, V>>): KPair<KVar, V> | null {
  while (sub != null) {
    const kv = sub.left
    const theV = kv.left
    if (v.equals(theV)) {
      return kv
    }
    sub = sub.right
  }
  return null
}

export function walk(v: KType, sub: KSubsitution): KType {
  if (v instanceof KVar) {
    const val = findVarDefine(v, sub)
    if (val) {
      //如果找到定义,对定义递归寻找
      return walk(val.right, sub)
    }
    return v
  } else if (v instanceof KPair) {
    return KPair.of(walk(v.left, sub), walk(v.right, sub))
  } else {
    return v
  }
}
export function extendSubsitution<K, V>(
  key: K,
  value: V,
  parent: List<KPair<K, V>>
) {
  return KPair.of(KPair.of(key, value), parent)
}
export function baseUnify(a: KType, b: KType, sub: KSubsitution): [boolean, KSubsitution] {
  a = walk(a, sub)
  b = walk(b, sub)
  if (a == b) {
    return [true, sub]
  }
  if (a instanceof KEqual) {
    if (a.equals(b)) {
      return [true, sub]
    }
  }
  if (b instanceof KEqual) {
    if (b.equals(a)) {
      return [true, sub]
    }
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
  if (a instanceof KPair && b instanceof KPair) {
    const [success, leftSub] = baseUnify(a.left, b.left, sub)
    if (success) {
      return baseUnify(a.right, b.right, leftSub)
    }
  }
  return [false, null]
}


export function fail<T>(sub: T): Stream<T> {
  return null
}

export function success<T>(sub: T): Stream<T> {
  return KPair.of(sub, emptyDelayStream)
}

export function toUnify(sub: KSubsitution, a: KType, b: KType): Stream<KSubsitution> {
  const [suc, sub1] = baseUnify(a, b, sub)
  if (suc) {
    return success(sub1)
  }
  return fail(sub1)
}

export function toNotUnify(sub: KSubsitution, a: KType, b: KType): Stream<KSubsitution> {
  const [suc, sub1] = baseUnify(a, b, sub)
  if (suc) {
    return fail(sub1)
  }
  return success(sub1)
}

export function unify(a: KType, b: KType): Goal<KSubsitution> {
  return function (sub) {
    return toUnify(sub, a, b)
  }
}

export function notUnify(a: KType, b: KType): Goal<KSubsitution> {
  return function (sub) {
    return toNotUnify(sub, a, b)
  }
}


export function toOr<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  return streamAppendStream(a(sub), function () {
    return b(sub)
  })
}

export function or<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toOr(sub, a, b)
  }
}

export function toAnd<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  return streamBindGoal(a(sub), b)
}

export function and<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toAnd(sub, a, b)
  }
}
export function cut<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toCut(sub, a, b)
  }
}

export function toCut<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  const subs = a(sub)
  if (subs) {
    //舍弃别的世界线
    return b(subs.left)
  }
  return subs
}

export function asCut<T>(a: Goal<T>): Goal<T> {
  return function (sub) {
    const first = a(sub)?.left
    if (first) {
      return success(first)
    }
    return null
  }
}


export function list<T>(...vs: T[]) {
  return toPairs(vs, null) as List<T>
}

export function toPairs<T, F>(vs: T[], end: F) {
  const lastIndex = vs.length - 1
  type RetType = F | T | KPair<T, RetType>
  let ret: RetType = end
  for (let i = lastIndex; i > -1; i--) {
    ret = KPair.of(vs[i], ret)
  }
  return ret
}

export function toArray(v: KType): [KType[], KType] {
  const list: KType[] = []
  while (v instanceof KPair) {
    list.push(v.left)
    v = v.right
  }
  return [list, v] as const
}

export function not<T>(g: Goal<T>): Goal<T> {
  return function (sub) {
    const s = g(sub)
    if (s) {
      return fail(sub)
    }
    return success(sub)
  }
}

export function getVarFromMap(map: Map<string, KVar>, key: string) {
  if (key == "_") {
    return KVar.create()
  }
  let oldVar = map.get(key)
  if (!oldVar) {
    oldVar = KVar.create()
    map.set(key, oldVar)
  }
  return oldVar
}
export function all<T>(a: Goal<T>, b: Goal<T>, ...vs: Goal<T>[]): Goal<T> {
  let r = and(a, b)
  for (let i = 0; i < vs.length; i++) {
    r = and(r, vs[i])
  }
  return r
}

export function any<T>(a: Goal<T>, b: Goal<T>, ...vs: Goal<T>[]): Goal<T> {
  let r = or(a, b)
  for (let i = 0; i < vs.length; i++) {
    r = or(r, vs[i])
  }
  return r
}

function collectVar(v: any, set: Set<KVar>) {
  if (v instanceof KVar) {
    set.add(v)
  } else if (v instanceof Array) {
    v.forEach(row => collectVar(row, set))
  } else if (v instanceof KPair) {
    collectVar(v.left, set)
    collectVar(v.right, set)
  } else if (v && typeof v == 'object') {
    for (const key in v) {
      collectVar(v[key], set)
    }
  }
}

function getVarRecord(map: Map<string, KVar>) {
  return new Proxy(emptyObject, {
    get(target, p, receiver) {
      return getVarFromMap(map, p as any)
    },
  })
}
export function topRule<Arg extends any[]>(
  fun: (...vs: Arg) => Goal<KSubsitution>
): (...vs: Arg) => Goal<KSubsitution> {
  return function (...vs) {
    const mSub = new MergeSub(vs)
    return function (sub) {
      // const map = new Map<string, KVar>()
      // const V = getVarRecord(map)
      const stream = fun(...vs)(sub)
      return streamBindGoal(stream, function (outSub) {
        return mSub.changeSub(outSub, sub)
      })
    }
  }
}

export function withVar<T>(fun: (v: VarV) => T, map = new Map<string, KVar>()) {
  const V = getVarRecord(map)
  return fun(V)
}

class MergeSub {
  constructor(vs: any) {
    collectVar(vs, this.set)
  }
  readonly set = new Set<KVar>()
  changeSub(outSub: KSubsitution, newSub: KSubsitution = null) {
    this.set.forEach(value => {
      const toValue = walk(value, outSub)
      if (!value.equals(toValue)) {
        newSub = extendSubsitution(value, toValue, newSub)
      }
    })
    return success(newSub)
  }
}
export function query<T>(fun: (v: Readonly<Record<string, KVar>>) => Goal<T>) {
  const map = new Map<string, KVar>()
  return [map, withVar(fun, map)] as const
}


export function match(base: Record<string, any>, query: Record<string, any>): Goal<KSubsitution> {
  return function (sub) {
    for (const key in query) {
      const value = query[key]
      const baseValue = base[key]
      const [suc, newSub] = baseUnify(sub, baseValue, value)
      if (suc) {
        sub = newSub
      } else {
        return fail(sub)
      }
    }
    return success(sub)
  }
}


/*****************************在作用域上隐式add,感觉意义不太,并不太方便,特别是取反麻烦******************************/

export function add(goal: Goal<KSubsitution>) {
  if (!globalStreams.length) {
    throw new Error("必须在串联中使用")
  }
  globalStreams[0] = streamBindGoal(globalStreams[0], goal)
}

let globalStreams: Stream<KSubsitution>[] = []
export type VarV = Readonly<Record<string, KVar>>
//串联
export function series(
  stream: Stream<KSubsitution>,
  fun: SetValue<VarV>,
  map = new Map<string, KVar>()
): Stream<KSubsitution> {
  globalStreams.unshift(stream)
  const V = getVarRecord(map)
  fun(V)
  return globalStreams.shift()!
}
//并联
export function parallel(
  a: SetValue<VarV>,
  b: SetValue<VarV>,
  ...vs: SetValue<VarV>[]
) {
  add(sub => {
    const stream = success(sub)
    let s = streamAppendStream(series(stream, a), () => {
      return series(stream, b)
    })
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      s = streamAppendStream(s, () => {
        return series(stream, v)
      })
    }
    return s
  })
}

export function seriesNot(fun: EmptyFun) {
  add(sub => {
    const inStream = success(sub)
    const outStream = series(inStream, fun)
    if (outStream) {
      return null
    } else {
      return inStream
    }
  })
}

export function topFun<Arg extends any[]>(
  fun: (...vs: Arg) => void
) {
  return function (...vs: Arg) {
    add(sub => {
      const mSub = new MergeSub(vs)
      // const map = new Map<string, KVar>()
      // const V = getVarRecord(map)
      return series(success(sub), (V) => {
        fun(...vs)
        add(outSub => {
          return mSub.changeSub(outSub, sub)
        })
      })
    })
  }
}
export function query1(
  fun: (
    v: Readonly<Record<string, KVar>>
  ) => void,
  stream: Stream<KSubsitution> = success(null)) {
  const map = new Map<string, KVar>()
  return [map, series(stream, fun, map)] as const
}