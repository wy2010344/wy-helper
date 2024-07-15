
/**
 * 设想
 * 1元操作符,
 * 2元操作符,
 * n元操作符
 * 和smalltalk类似
 * 但各种符号有优先级,一元有优先级,所以左结合或右结合
 * 二元有优先级,
 * n元如何区分优先级?是否需要$符号实现一定的延迟?
 * 或者只用二元
 */

import { MatchGet } from "./parseInfix"
import { BaseDisplayT, buildInfix, endNotFillToToken, InfixNode } from "./tool"
import {
  Que, isParseSuccess, manyMatch,
  matchCharIn, ruleStrBetween,
  ruleGetString as queToString,
  ruleStrBetweenGet, stringToCharCode,
  or,
  andMatch,
  orMatchEmpty
} from "../tokenParser";
import {
  symbolRule,
  StringToken, NumberToken,
  SymbolToken, VarToken,
  ruleGetNumber, ruleGetString,
  ruleGetSymbol, ruleGetVar,
  skipWhiteOrComment
} from "./relayParseRule";


/**
 * 
 * 并不是很好处理....
 * 顶层要特殊,连带着所有子句要特殊,去顶层查询
 * 只是叶子节点可以使用中缀
 * 
 * 
 * 
 * js中的优先级
 * 
指数运算符 (**)
乘法 (*), 除法 (/), 取模 (%)
加法 (+), 减法 (-)
左移 (<<), 右移 (>>), 无符号右移 (>>>)
小于 (<), 小于等于 (<=), 大于 (>), 大于等于 (>=)
相等 (==), 不等 (!=), 全等 (===), 不全等 (!==)
按位与 (&)
按位异或 (^)
按位或 (|)
逻辑与 (&&)
逻辑或 (||)
三元条件运算符 (?:)
 */
const nc = "'".charCodeAt(0)
export const matchBetween: MatchGet = {
  match: ruleStrBetween(nc),
  get(begin, end) {
    const value = queToString(begin, end)
    const nValue = ruleStrBetweenGet(nc)(new Que(value))
    if (isParseSuccess(nValue) && nValue.end.i == value.length) {
      return nValue.value
    } else {
      throw nValue
    }
  },
  stringify(n) {
    return ` '${n.replace(/`/g, '\\`')}' `
  },
  display: "anyMatch~"
}


/**
 * 向后的可以排除,在前的却只有不参与
 */
const specialChar = "~`!@#$^&?<>|:{}=+-*/"
const specialMatchRule = manyMatch(matchCharIn(
  ...stringToCharCode(specialChar)
), 1)
/**
 * 这里,可以为任何连字符
 * 
 */
export const specialMatch: MatchGet = {
  match: specialMatchRule,
  get(begin, end) {
    return queToString(begin, end)
  },
  stringify(n) {
    return n
  },
  display: 'specialMatch'
}

export const matchSymbolOrSpecial: MatchGet = {
  match: andMatch(
    symbolRule,
    orMatchEmpty(specialMatchRule)
  ),
  get(begin, end) {
    return queToString(begin, end)
  },
  stringify(n) {
    return ` ${n} `
  },
  display: 'symbolMatch'
}

export const infixLibArray = [
  [';'],//或结束
  [':-'],//规则定义
  [','],//and结束
  ['='],//绑定
  [matchBetween, specialMatch, matchSymbolOrSpecial],
  ['+', '-'],
  ['*', '/', '%']
]

export const { parseSentence, getInfixOrder } = buildInfix<EndNode>(
  infixLibArray,
  skipWhiteOrComment,
  () => {
    return or([
      ruleGetVar,
      ruleGetString,
      ruleGetSymbol,
      ruleGetNumber,
    ])
  }, (infix, left, right) => {
    return {
      type: "infix",
      infix,
      left,
      right
    }
  })

type NNode = StringToken | SymbolToken | NumberToken | VarToken
export type EndNode = NNode | InfixNode<NNode>



export type DisplayT = {
  type: "white" | "keyword" | "number" | "string" | "variable"
} & BaseDisplayT

function unsafeAdd(k: DisplayT['type']) {
  return function (v: BaseDisplayT) {
    const n = v as DisplayT
    n.type = k
    return n
  }
}
export const toFillToken = endNotFillToToken<EndNode, DisplayT>(endNode => {
  if (endNode.type == 'string') {
    return {
      type: "string",
      value: endNode.originalValue,
      begin: endNode.begin,
      end: endNode.end
    }
  } else if (endNode.type == 'number') {
    return ({
      type: "number",
      value: endNode.originalValue,
      begin: endNode.begin,
      end: endNode.end
    })
  } else if (endNode.type == 'symbol') {
    return ({
      type: "string",
      value: endNode.value,
      begin: endNode.begin,
      end: endNode.end
    })
  } else if (endNode.type == 'var') {
    return ({
      type: "variable",
      value: endNode.value,
      begin: endNode.begin,
      end: endNode.end
    })
  } else {
    throw new Error("unknown type")
  }
}, unsafeAdd("keyword"), unsafeAdd("white"))

