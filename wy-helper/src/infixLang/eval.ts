import {
  KVar,
  List,
  Stream,
  extendSubsitution,
  fail,
  streamAppendStream,
  streamBindGoal,
  success,
} from '../kanren'
import { EndNode, getInfixOrder } from './parse'
import { VarPool } from './tool'
import {
  IPair,
  ISubsitution,
  IType,
  baseUnify,
  walk,
  walkWithSet,
} from './rewrite'
import { infixRightNeedQuote } from './parseInfix'

export type RuleScope = List<EvalRule>
export function topEvalExp(sub: ISubsitution, topRules: RuleScope, exp: IType) {
  const set = new Set<KVar>()
  const newExp = walkWithSet(exp, sub, set)
  //这种方式明显缩小了作用域长度
  return streamBindGoal(
    toEvalRules(topRules, newExp, topRules),
    function (outSub) {
      let newSub = sub
      set.forEach((value) => {
        const toValue = walk(value, outSub)
        if (!value.equals(toValue)) {
          newSub = extendSubsitution(value, toValue, newSub)
        }
      })
      return success(newSub)
    }
  )
}

function toEvalRules(
  rules: RuleScope,
  exp: IType,
  topRules: RuleScope
): Stream<ISubsitution> {
  if (rules) {
    const first = rules.left
    const right = rules.right
    return streamAppendStream(first(exp, topRules), function () {
      return toEvalRules(right, exp, topRules)
    })
  }
  return null
}
export function infixValue<L, R>(left: L, infix: string, right: R) {
  return new IPair(infix, left, right)
}

export function displayValue(v: IType): any {
  if (v instanceof IPair) {
    return [displayValue(v.left), v.type, displayValue(v.right)]
  } else {
    return v
  }
}

export function innerStringify(
  v: IType,
  pOrder: number = -1,
  onRight?: boolean
): string {
  if (v instanceof IPair) {
    const [order, simple, rev] = getInfixOrder(v.type)
    const left = innerStringify(v.left, order, rev)
    const right = innerStringify(v.right, order, !rev)
    const needQuote = infixRightNeedQuote(pOrder, order, onRight)
    const value = `${left}${simple}${right}`
    if (needQuote) {
      return `(${value})`
    } else {
      return value
    }
  }
  return v + ''
}
export function stringify(v: IType) {
  return innerStringify(v, -1)
}

function evalEndNodeArg(n: EndNode, pool: VarPool): IType {
  if (n.type == 'infix') {
    const infix = n.infix.value
    // if (infix == 'join@') {
    //   const right = evalEndNodeArg(n.right, pool)
    //   if (typeof right == 'string') {
    //     const left = evalEndNodeArg(n.left, pool)
    //     if (left instanceof IPair) {
    //       return mapJoin(left.left, left.type, left.right, right)
    //     }
    //   }
    // }
    return infixValue(
      evalEndNodeArg(n.left, pool),
      infix,
      evalEndNodeArg(n.right, pool)
    )
  } else if (n.type == 'var') {
    return pool.get(n.value, true)
  } else {
    return n.value
  }
}
/**
 * 全是字符串,空直接用字符串nil
 * @param n
 * @param pool
 * @param arg 是否是对arg的渲染
 * @returns
 */
export function evalEndNode(n: EndNode, pool: VarPool): IType {
  if (n.type == 'infix') {
    const infix = n.infix.value
    if (infix == ':-') {
      const newPool = new VarPool(pool)
      return infixValue(
        evalEndNodeArg(n.left, newPool),
        infix,
        evalEndNode(n.right, newPool)
      )
    }
    // else if (infix == 'join@') {
    //   const right = evalEndNode(n.right, pool)
    //   if (typeof right == 'string') {
    //     const left = evalEndNode(n.left, pool)
    //     if (left instanceof IPair) {
    //       const v = mapJoin(left.left, left.type, left.right, right)
    //       console.log("d", v)
    //       return v
    //     }
    //   }
    // }
    return infixValue(
      evalEndNode(n.left, pool),
      infix,
      evalEndNode(n.right, pool)
    )
  } else if (n.type == 'var') {
    return pool.get(n.value)
  } else {
    return n.value
  }
}

function mapJoin(
  list: IType,
  infix: string,
  right: IType,
  split: string
): IType {
  if (list instanceof IPair && list.type == ',') {
    return infixValue(
      infixValue(mapJoin(list.left, infix, right, split), infix, right),
      split,
      infixValue(list.right, infix, right)
    )
  }
  return list
}

export type EvalRule = (exp: IType, topRules: RuleScope) => Stream<ISubsitution>

function cloneIType(exp: IType, pool: VarPool): IType {
  if (exp instanceof IPair) {
    return infixValue(
      cloneIType(exp.left, pool),
      exp.type,
      cloneIType(exp.right, pool)
    )
  } else if (exp instanceof KVar) {
    return pool.get(exp.flag)
  } else {
    return exp
  }
}

export function toCustomRule(head: IType, body?: IType): EvalRule {
  return (exp, topRules) => {
    const pool = new VarPool()
    const headExp = cloneIType(head, pool)
    const [match, sub] = baseUnify(headExp, exp, null)
    if (match) {
      const stream = success(sub)
      if (body) {
        return streamBindGoal(stream, function (sub) {
          const bodyExp = cloneIType(body, pool)
          return topEvalExp(sub, topRules, bodyExp)
        })
      }
      return stream
    }
    return fail(sub)
  }
}
