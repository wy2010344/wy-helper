import { baseUnify, KSubsitution, KType, KVar, pair } from './util';

type Goal = (state: KSubsitution) => Generator<KSubsitution>;

export function* toAnd(state: KSubsitution, g1: Goal, g2: Goal) {
  for (const s1 of g1(state)) {
    yield* g2(s1);
  }
}

function and(g1: Goal, g2: Goal) {
  return function (state: KSubsitution) {
    return toAnd(state, g1, g2);
  };
}

export function* toOr(state: KSubsitution, g1: Goal, g2: Goal) {
  yield* g1(state);
  yield* g2(state);
}

function or(g1: Goal, g2: Goal) {
  return function (state: KSubsitution) {
    return toOr(state, g1, g2);
  };
}

export function* toUnify(sub: KSubsitution, a: KType, b: KType) {
  const [suc, sub1] = baseUnify(a, b, sub);
  if (suc) {
    yield sub1;
  }
}
function unify(a: KType, b: KType) {
  return function (state: KSubsitution) {
    return toUnify(state, a, b);
  };
}

function append(a: KType, b: KType, c: KType) {
  return function* (state: KSubsitution): Generator<KSubsitution> {
    const h = KVar.create();
    const t = KVar.create();
    const res = KVar.create();
    yield* or(
      and(unify(a, null), unify(b, c)),
      and(and(unify(a, pair(h, t)), unify(c, pair(h, res))), s =>
        append(t, b, res)(s)
      )
    )(state);
  };
}
