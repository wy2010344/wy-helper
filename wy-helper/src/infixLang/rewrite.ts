import {
  KPair,
  KVar,
  List,
  extendSubsitution,
  findVarDefine,
  success,
} from '../kanren';

export class IPair<L, R> {
  constructor(
    public readonly type: string,
    public readonly left: L,
    public readonly right: R
  ) {}
}

export type IType = KVar | IPair<IType, IType> | string | number;
/**
 * 作用域链表,key为KVar,value变具体类型,或仍为KVar
 */
export type ISubsitution = List<KPair<KVar, IType>>;
export function walk(v: IType, sub: ISubsitution): IType {
  if (v instanceof KVar) {
    const val = findVarDefine(v, sub);
    if (val) {
      //如果找到定义,对定义递归寻找
      return walk(val.right, sub);
    }
    return v;
  } else if (v instanceof IPair) {
    return new IPair(v.type, walk(v.left, sub), walk(v.right, sub));
  } else {
    return v;
  }
}
export function baseUnify(
  a: IType,
  b: IType,
  sub: ISubsitution
): [boolean, ISubsitution] {
  a = walk(a, sub);
  b = walk(b, sub);
  if (a == b) {
    return [true, sub];
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
  if (a instanceof IPair && b instanceof IPair && a.type == b.type) {
    const [success, leftSub] = baseUnify(a.left, b.left, sub);
    if (success) {
      return baseUnify(a.right, b.right, leftSub);
    }
  }
  return [false, null];
}

export function toUnify(a: IType, b: IType, sub: ISubsitution) {
  const [s, nsub] = baseUnify(a, b, sub);
  if (s) {
    return success(nsub);
  }
  return null;
}

export function walkWithSet(value: IType, sub: ISubsitution, set: Set<KVar>) {
  value = walk(value, sub);
  findSub(value, set);
  return value;
}

function findSub(value: IType, set: Set<KVar>) {
  if (value instanceof IPair) {
    findSub(value.left, set);
    findSub(value.right, set);
  } else if (value instanceof KVar) {
    set.add(value);
  }
}
