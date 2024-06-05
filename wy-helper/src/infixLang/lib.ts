import { KVar, List, Stream, fail, list, pair, streamAppendStream, streamBindGoal, success, } from "../kanren";
import { EvalRule, RuleScope, infixValue, stringify, toCustomRule, topEvalExp } from "./eval";
import { IPair, ISubsitution, IType, toUnify } from "./rewrite";
export const defineRules: RuleScope = list(
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == ',') {
      return streamBindGoal(
        topEvalExp(null, topRules, exp.left),
        function (sub) {
          return topEvalExp(sub, topRules, exp.right)
        })
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == ';') {
      return streamAppendStream(topEvalExp(null, topRules, exp.left), function () {
        return topEvalExp(null, topRules, exp.right)
      })
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == 'not' && exp.right == 'true') {
      const out = topEvalExp(null, topRules, exp.left)
      if (out) {
        return fail(null)
      }
      return success(null)
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == 'queryIn' && exp.right == 'global') {
      return topEvalExp(null, topRules, exp.left)
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == 'jsEval') {
      const left = exp.left
      if (typeof left == 'string') {
        try {
          const out = eval(left)
          return toUnify(out, exp.right, null)
        } catch (err) {

        }
      }
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == 'write') {
      console.log(exp.left, stringify(exp.right))
      return success(null)
    }
    return null
  },
  (exp) => {
    if (exp instanceof IPair && exp.type == 'isTypeSimple') {
      const left = exp.left
      let tp = ''
      if (left instanceof IPair) {
        tp = 'pair'
      } else if (left instanceof KVar) {
        tp = 'var'
      } else {
        tp = typeof left
      }
      return toUnify(tp, exp.right, null)
    }
    return null
  },
  (exp) => {
    if (exp instanceof IPair && exp.type == 'isType') {
      const tp = getDeepType(exp.left)
      return toUnify(tp, exp.right, null)
    }
    return null
  },
  (exp) => {
    if (exp instanceof IPair && exp.type == '==') {
      return toUnify(exp.left, exp.right, null)
    }
    return null
  },
  (exp, topRules) => {
    if (exp instanceof IPair && exp.type == 'apply') {
      const left = exp.left
      return orReturnStream(left, exp.right, topRules)
    }
    return null
  }
)


function orReturnStream(left: IType, exp: IType, topRules: RuleScope): Stream<ISubsitution> {
  if (left instanceof IPair && left.type == ';') {
    return streamAppendStream(orReturnStream(left.left, exp, topRules), () => {
      return getOneReturn(left.right, exp, topRules)
    })
  } else {
    return getOneReturn(left, exp, topRules)
  }
}

function getOneReturn(left: IType, exp: IType, topRules: RuleScope) {
  const rule = getOneRule(left)
  return rule(exp, topRules)
}

function getDeepType(left: IType) {
  let tp: any = ''
  if (left instanceof IPair) {
    tp = infixValue(getDeepType(left.left), left.type, getDeepType(left.right))
  } else if (left instanceof KVar) {
    tp = 'var'
  } else {
    tp = typeof left
  }
  return tp
}


function getOneRule(exp: IType) {
  if (exp instanceof IPair && exp.type == ':-') {
    return toCustomRule(exp.left, exp.right)
  } else {
    return toCustomRule(exp)
  }
}

export function translateRule(
  exp: IType
) {
  return getRules(exp, defineRules)
}


function getRules(exp: IType, topRules: RuleScope) {
  if (exp instanceof IPair && exp.type == ';') {
    return getRules(exp.left, pair(getOneRule(exp.right), topRules))
  } else {
    return pair(getOneRule(exp), topRules)
  }
}
export function runQuery(rules: List<EvalRule>, query: IType) {
  return topEvalExp(null, rules, query)
}
/**
 * (H,T) acc A rev R :- 
  T acc (H,A) rev R.
nil acc A rev A.
L rev R :- 
  L acc nil rev R.

nil naivrev nil.
(H,T) naivrev R :-
  T naivrev RevT,
  (
    X = nil + X.
    (M,Z) = (M,X) + Y :-
      xy write(X,Y),Z=X+Y.
    revT write RevT,h write H,R = RevT + (H,nil)
  ).
(1,2,3,4,5,6,nil) naivrev A



(M,Z)=X+(Y,Z):-
  M=X+Z.
M=M+nil,
(nil,1,2,3,4+8,5*7+6,6) = X + Y



 (M ,Z) = A + (Y,Z) :-
  M=A+Y.
X = X + nil.

(X apply Y) beta M:-
	

(nil,1,2,3,4+8,5*7+6,6) = X + Y  


X != Y :- 
  X == Y not true;
V -> V apply A breduTo A :-
  V isType string;
V -> W apply _ breduTo W:-
  W isType string,
  V != W;
V -> (V -> B) apply _ breduTo (V -> B);
V -> (W -> B) apply A breduTo (W -> S) :-
  W != V,
  V -> B apply A breduTo S;
V -> (E1 apply E2) apply A breduTo (R1 apply R2):-
  V -> E1 apply A breduTo R1,
  V -> E2 apply A breduTo R2;


E1 apply E2 evalTo R :-
  E1 evalTo R1, E1!=R1,
  R1 apply E2 evalTo R;
E1 apply E2 evalTo R :-
  E1 apply E2 breduTo R1,
  R1 evalTo R;
L evalTo L;

A apply (X :- Y):-
  A==X,Y queryIn global


(1,2,3,X) apply ((X,Y):-(X==Y))

x -> (y -> (y apply x)) apply (a-> (a apply a) apply b) evalTo M

A apply (X :- Y):-
  A==X,
  Y queryIn global
 */