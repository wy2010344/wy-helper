import {
  KPair,
  KSubsitution,
  KType,
  baseUnify,
  MergeSub,
  KVar,
  withVar,
  VarV,
  getVarRecord,
} from './util';
import { SetValue } from '../setStateHelper';
import { EmptyFun } from '../util';
/**
 * 平行可能行->所有作用域
 * 不同的世界线。没有，或有一个，但后继是空。
 * 是一种或匹配关系
 */
export type DelayStream<V> = () => Stream<V>;
export type Stream<V> = null | KPair<V, DelayStream<V>>;
export const emptyDelayStream: DelayStream<any> = () => null;
/**
 * 增加世界线b
 * 在a流查找后（包括a的所有后继），在b的流继续查找
 *
 * 联合、合集
 * @param a
 * @param b
 */
export function streamAppendStream<V>(
  a: Stream<V>,
  b: DelayStream<V>
): Stream<V> {
  if (a == null) {
    return b();
  } else {
    //如果a有后继，追加到后继之后
    return KPair.of(a.left, function () {
      return streamAppendStream(a.right(), b);
    });
  }
}
/**
 * 求解目标，代入作用域在不同世界线上求解。
 * 作用域在同一世界线上是叠加的。
 */
export type Goal<V> = (sub: V) => Stream<V>;
/**
 * 为所有的世界线应用一个条件，变换成新的世界线列表
 * 在a流中，使用b目标查找，每一个节点的尝试
 * 用于and语句
 *
 * 集合的求交集,既满足a,也满足b
 * mplus
 * @param a
 * @param b
 */
export function streamBindGoal<V>(a: Stream<V>, b: Goal<V>): Stream<V> {
  if (a == null) {
    return null;
  } else {
    //如果a有后继流，则递归处理
    return streamAppendStream(b(a.left), function () {
      return streamBindGoal(a.right(), b);
    });
  }
}

export function fail<T>(sub: T): Stream<T> {
  return null;
}

export function success<T>(sub: T): Stream<T> {
  return KPair.of(sub, emptyDelayStream);
}

export function toUnify(
  sub: KSubsitution,
  a: KType,
  b: KType
): Stream<KSubsitution> {
  const [suc, sub1] = baseUnify(a, b, sub);
  if (suc) {
    return success(sub1);
  }
  return fail(sub1);
}

export function toNotUnify(
  sub: KSubsitution,
  a: KType,
  b: KType
): Stream<KSubsitution> {
  const [suc, sub1] = baseUnify(a, b, sub);
  if (suc) {
    return fail(sub1);
  }
  return success(sub1);
}

export function unify(a: KType, b: KType): Goal<KSubsitution> {
  return function (sub) {
    return toUnify(sub, a, b);
  };
}

export function notUnify(a: KType, b: KType): Goal<KSubsitution> {
  return function (sub) {
    return toNotUnify(sub, a, b);
  };
}

export function toOr<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  return streamAppendStream(a(sub), function () {
    return b(sub);
  });
}

export function or<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toOr(sub, a, b);
  };
}

export function toAnd<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  return streamBindGoal(a(sub), b);
}

export function and<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toAnd(sub, a, b);
  };
}
export function cut<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
  return function (sub) {
    return toCut(sub, a, b);
  };
}

export function toCut<T>(sub: T, a: Goal<T>, b: Goal<T>) {
  const subs = a(sub);
  if (subs) {
    //舍弃别的世界线
    return b(subs.left);
  }
  return subs;
}

export function asCut<T>(a: Goal<T>): Goal<T> {
  return function (sub) {
    const first = a(sub)?.left;
    if (first) {
      return success(first);
    }
    return null;
  };
}

export function not<T>(g: Goal<T>): Goal<T> {
  return function (sub) {
    const s = g(sub);
    if (s) {
      return fail(sub);
    }
    return success(sub);
  };
}

export function all<T>(a: Goal<T>, b: Goal<T>, ...vs: Goal<T>[]): Goal<T> {
  let r = and(a, b);
  for (let i = 0; i < vs.length; i++) {
    r = and(r, vs[i]);
  }
  return r;
}

export function any<T>(a: Goal<T>, b: Goal<T>, ...vs: Goal<T>[]): Goal<T> {
  let r = or(a, b);
  for (let i = 0; i < vs.length; i++) {
    r = or(r, vs[i]);
  }
  return r;
}

export function topRule<Arg extends any[]>(
  fun: (...vs: Arg) => Goal<KSubsitution>
): (...vs: Arg) => Goal<KSubsitution> {
  return function (...vs) {
    const mSub = new MergeSub(vs);
    return function (sub) {
      // const map = new Map<string, KVar>()
      // const V = getVarRecord(map)
      const stream = fun(...vs)(sub);
      return streamBindGoal(stream, function (outSub) {
        return success(mSub.changeSub(outSub, sub));
      });
    };
  };
}

export function query<T>(fun: (v: Readonly<Record<string, KVar>>) => Goal<T>) {
  const map = new Map<string, KVar>();
  return [map, withVar(fun, map)] as const;
}

export function match(
  base: Record<string, any>,
  query: Record<string, any>
): Goal<KSubsitution> {
  return function (sub) {
    for (const key in query) {
      const value = query[key];
      const baseValue = base[key];
      const [suc, newSub] = baseUnify(sub, baseValue, value);
      if (suc) {
        sub = newSub;
      } else {
        return fail(sub);
      }
    }
    return success(sub);
  };
}

/*****************************在作用域上隐式add,感觉意义不太,并不太方便,特别是取反麻烦******************************/

export function add(goal: Goal<KSubsitution>) {
  if (!globalStreams.length) {
    throw new Error('必须在串联中使用');
  }
  globalStreams[0] = streamBindGoal(globalStreams[0], goal);
}

const globalStreams: Stream<KSubsitution>[] = [];
//串联
export function series(
  stream: Stream<KSubsitution>,
  fun: SetValue<VarV>,
  map = new Map<string, KVar>()
): Stream<KSubsitution> {
  globalStreams.unshift(stream);
  const V = getVarRecord(map);
  fun(V);
  return globalStreams.shift()!;
}
//并联
export function parallel(
  a: SetValue<VarV>,
  b: SetValue<VarV>,
  ...vs: SetValue<VarV>[]
) {
  add(sub => {
    const stream = success(sub);
    let s = streamAppendStream(series(stream, a), () => {
      return series(stream, b);
    });
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i];
      s = streamAppendStream(s, () => {
        return series(stream, v);
      });
    }
    return s;
  });
}

export function seriesNot(fun: EmptyFun) {
  add(sub => {
    const inStream = success(sub);
    const outStream = series(inStream, fun);
    if (outStream) {
      return null;
    } else {
      return inStream;
    }
  });
}

export function topFun<Arg extends any[]>(fun: (...vs: Arg) => void) {
  return function (...vs: Arg) {
    add(sub => {
      const mSub = new MergeSub(vs);
      // const map = new Map<string, KVar>()
      // const V = getVarRecord(map)
      return series(success(sub), V => {
        fun(...vs);
        add(outSub => {
          return success(mSub.changeSub(outSub, sub));
        });
      });
    });
  };
}
export function query1(
  fun: (v: Readonly<Record<string, KVar>>) => void,
  stream: Stream<KSubsitution> = success(null)
) {
  const map = new Map<string, KVar>();
  return [map, series(stream, fun, map)] as const;
}
