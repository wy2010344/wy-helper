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

import {
  BaseDisplayT,
  buildInfix,
  endNotFillToToken,
  InfixNode,
  MatchGet,
  toInfixConfig,
} from './tool'
import {
  Que,
  isParseSuccess,
  manyMatch,
  matchCharIn,
  ruleStrBetween,
  ruleGetString as queToString,
  ruleStrBetweenGet,
  stringToCharCode,
  or,
  andMatch,
  orMatchEmpty,
  ruleStrBetweenGet1,
  parseGet,
  matchAnyString,
  ParseFun,
} from '../tokenParser'
import {
  symbolRule,
  StringToken,
  NumberToken,
  SymbolToken,
  VarToken,
  ruleGetNumber,
  ruleGetString,
  ruleGetSymbol,
  ruleGetVar,
  skipWhiteOrComment,
} from './relayParseRule'

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

function parseInfixNode(value: {
  match: ParseFun<Que>
  get?(value: string): string
  stringify?(n: string): string
  display: string
}): MatchGet<InfixToken> {
  return {
    parse() {
      return parseGet<Que, InfixToken>(value.match, (begin, end) => {
        const originalValue = queToString(begin, end)
        const str = value.get ? value.get(originalValue) : originalValue
        return {
          originalValue,
          value: str,
          begin: begin.i,
          end: end.i,
          errors: [],
        }
      })
    },
    match(n) {
      return value.match(new Que(n))
    },
    stringify: value.stringify,
  }
}

export const matchBetween = parseInfixNode({
  match: ruleStrBetween(nc),
  get(value) {
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
  display: 'anyMatch~',
})

/**
 * 向后的可以排除,在前的却只有不参与
 */
const specialChar = '~`!@#$^&?<>|:{}=+-*/'
const specialMatchRule = manyMatch(
  matchCharIn(...stringToCharCode(specialChar)),
  1
)

const specialMatch = parseInfixNode({
  match: specialMatchRule,
  display: 'specialMatch',
})

const matchSymbolOrSpecial = parseInfixNode({
  match: andMatch(symbolRule, orMatchEmpty(specialMatchRule)),
  stringify(n) {
    return ` ${n} `
  },
  display: 'symbolMatch',
})

export const infixLibArray = [
  [';'], //或结束
  [':-'], //规则定义
  [','], //and结束
  ['='], //绑定
  [matchBetween, specialMatch, matchSymbolOrSpecial],
  ['+', '-'],
  ['*', '/', '%'],
]

export const { array, getInfixOrder } = toInfixConfig(
  infixLibArray,
  (begin, value, end) => {
    return {
      value,
      originalValue: value,
      begin,
      end,
    } as InfixToken
  }
)
export const { parseSentence } = buildInfix(
  array,
  skipWhiteOrComment,
  (infix, left, right) => {
    return {
      type: 'infix',
      infix,
      left,
      right,
    }
  }
)

type NNode = StringToken | SymbolToken | NumberToken | VarToken
export type EndNode = NNode | InfixNode<NNode, InfixToken>
export type DisplayT = {
  type: 'white' | 'keyword' | 'number' | 'string' | 'variable'
} & BaseDisplayT

function unsafeAdd(k: DisplayT['type']) {
  return function (v: BaseDisplayT) {
    const n = v as DisplayT
    n.type = k
    return n
  }
}
export const toFillToken = endNotFillToToken<EndNode, InfixToken, DisplayT>(
  (endNode) => {
    if (endNode.type == 'string') {
      return {
        type: 'string',
        value: endNode.originalValue,
        begin: endNode.begin,
        end: endNode.end,
      }
    } else if (endNode.type == 'number') {
      return {
        type: 'number',
        value: endNode.originalValue,
        begin: endNode.begin,
        end: endNode.end,
      }
    } else if (endNode.type == 'symbol') {
      return {
        type: 'string',
        value: endNode.value,
        begin: endNode.begin,
        end: endNode.end,
      }
    } else if (endNode.type == 'var') {
      return {
        type: 'variable',
        value: endNode.value,
        begin: endNode.begin,
        end: endNode.end,
      }
    } else {
      throw new Error('unknown type')
    }
  },
  (old) => {
    return {
      type: 'keyword',
      begin: old.begin,
      end: old.end,
      value: old.originalValue,
    }
  },
  unsafeAdd('white')
)

export interface InfixToken {
  begin: number
  end: number
  value: string
  originalValue: string
}
