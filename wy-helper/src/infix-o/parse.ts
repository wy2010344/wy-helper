import { emptyFun, GetValue } from '..'
import {
  BaseDisplayT,
  buildInfix,
  endNotFillToToken,
  matchCommonExt,
  MatchGet,
  ruleGetNumber,
  ruleGetString,
  skipWhiteOrComment,
  toInfixConfig,
} from '../infixLang'
import {
  andMatch,
  getCurrentQue,
  isChinese,
  isLowerEnglish,
  isUpperEnglish,
  manyMatch,
  matchCharIn,
  or,
  orMatch,
  parseGet,
  Que,
  stringToCharCode,
  runParse,
} from '../tokenParser'
export interface Token {
  begin: number
  end: number
  messages: Message[]
}
export type Message = {
  type: 'error' | 'type'
  value: string
}
export interface SymbolToken extends Token {
  type: 'symbol'
  originalValue: string
  value: string
}

export interface RefToken extends Token {
  type: 'ref'
  value: string
}
//这两个暂时先不考虑??
export interface StringToken extends Token {
  type: 'string'
  originalValue: string
  value: string
}

export interface NumberToken extends Token {
  type: 'number'
  value: number
  originalValue: string
}

export const parseSymbol = andMatch(
  matchCharIn('#'.charCodeAt(0)),
  matchCommonExt
)
export function ruleGetSymbol() {
  return parseGet<Que, SymbolToken>(parseSymbol, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: 'symbol',
      originalValue: value,
      value: value.slice(1),
      begin: begin.i,
      end: end.i,
    } as SymbolToken
  })
}

export type NNode =
  | StringToken
  | RefToken
  | NumberToken
  | SymbolToken
  | BlockToken
  | NestScopeToken

const refRule = andMatch(
  orMatch(
    isLowerEnglish.matchCharBetween(),
    isUpperEnglish.matchCharBetween(),
    isChinese.matchCharBetween()
  ),
  matchCommonExt
)
const specialChar = '~`!@$^&?<>|+-*/'
const specialMatchRule = manyMatch(
  matchCharIn(...stringToCharCode(specialChar)),
  1
)
const getRef = orMatch(refRule, specialMatchRule)
export function ruleGetRef() {
  return parseGet<Que, RefToken>(
    getRef,
    function (begin, end) {
      const value = begin.content.slice(begin.i, end.i)
      return {
        type: 'ref',
        begin: begin.i,
        end: end.i,
        value,
        messages: [],
      } as RefToken
    },
    'symbol'
  )
}

function rGetNumber() {
  const n = ruleGetNumber() as NumberToken
  n.messages = []
  return n
}

function rGetStr() {
  const n = ruleGetString() as StringToken
  n.messages = []
  return n
}

const matchBetween: MatchGet<StringToken> = {
  parse: ruleGetString as GetValue<StringToken>,
  match(n: any) {
    return false
  },
  stringify(n) {
    return ` '${n.replace(/`/g, '\\`')}' `
  },
}
const symbolMatch: MatchGet<SymbolToken> = {
  parse: ruleGetSymbol,
  match(n) {
    return n.type == 'symbol'
  },
  stringify(n) {
    return ` ${n} `
  },
}
const refMatch: MatchGet<RefToken> = {
  parse: ruleGetRef,
  match(n) {
    return n.type == 'ref'
  },
}

function quote(): EndNode {
  return parseQuoteLeaf(ruleGetLeafQuote, '(', ')')
}
function ruleGetLeafQuote(): EndNode {
  return or([
    rGetStr,
    ruleGetSymbol,
    ruleGetRef,
    rGetNumber,
    ruleGetBlock,
    ruleGetSealed,
    quote,
  ])
}
const quoteMatch: MatchGet<EndNode> = {
  parse: quote,
  match(n) {
    return n.type == 'infix'
  },
}
const config = toInfixConfig<EndNode>(
  [
    //换行
    {
      type: 'rev',
      values: [',', ';'],
    },
    //固定值,变量,赋值变量,注意顺序
    [':=', '=:', '='],
    [
      matchBetween, //单引号的字符串
      symbolMatch,
      refMatch,
      quoteMatch,
    ],
  ],
  function (begin, value, end) {
    return {
      type: 'ref',
      value,
      begin,
      end,
      messages: [],
    }
  }
)
export type InfixNode<T> = {
  type: 'infix'
  infix: EndNode
  left: InfixEndNode<T>
  right: InfixEndNode<T>
  messages: Message[]
}

export interface NestScopeToken extends Token {
  type: 'nest'
  body: EndNode
}
/**
 * {
 *  ab = [
 *
 *  ];
 *  dafew
 * }
 * @returns
 */
function ruleGetSealed(): NestScopeToken {
  const begin = getCurrentQue()!.i
  const body = parseQuoteLeaf(ruleGetLeafQuote, '{', '}')
  const end = getCurrentQue()!.i
  return {
    begin,
    end,
    type: 'nest',
    body,
    messages: [],
  }
}

//这两个暂时先不考虑??
export interface BlockToken extends Token {
  type: 'block'
  exp: EndNode
}
function ruleGetBlock(): BlockToken {
  const begin = getCurrentQue()!.i
  const body = parseQuoteLeaf(ruleGetLeafQuote, '[', ']')
  const end = getCurrentQue()!.i
  return {
    begin,
    end,
    type: 'block',
    exp: body,
    messages: [],
  }
}

export type InfixEndNode<T> = T | InfixNode<T>
export type EndNode = NNode | InfixNode<NNode>
const { parseSentence, parseQuoteLeaf } = buildInfix<EndNode, EndNode>(
  config.array,
  skipWhiteOrComment,
  (infix, left, right) => {
    return {
      type: 'infix',
      infix,
      left,
      right,
      messages: [],
    } as const
  }
)

function mainParse() {
  return parseSentence(ruleGetLeafQuote)
}
export function parse(value: string) {
  return runParse(value, mainParse)
}

export type DisplayT = {
  type: 'white' | 'keyword' | 'number' | 'string' | 'variable' | 'symbol'
} & BaseDisplayT

export type DisplayValue = DisplayT & {
  messages: Message[]
}

function unsafeAdd(k: DisplayT['type']) {
  return function (v: BaseDisplayT) {
    const n = v as DisplayValue
    n.type = k
    return n
  }
}

function parseOne(
  endNode: EndNode,
  list: DisplayValue[],
  parseSelf: (endNode: EndNode) => void
) {
  if (endNode.type == 'string') {
    list.push({
      type: 'string',
      value: endNode.originalValue,
      begin: endNode.begin,
      end: endNode.end,
      messages: endNode.messages,
    })
  } else if (endNode.type == 'number') {
    list.push({
      type: 'number',
      value: endNode.originalValue,
      begin: endNode.begin,
      end: endNode.end,
      messages: endNode.messages,
    })
  } else if (endNode.type == 'ref') {
    list.push({
      type: 'variable',
      value: endNode.value,
      begin: endNode.begin,
      end: endNode.end,
      messages: endNode.messages,
    })
  } else if (endNode.type == 'symbol') {
    list.push({
      type: 'symbol',
      value: endNode.originalValue,
      begin: endNode.begin,
      end: endNode.end,
      messages: endNode.messages,
    })
  } else if (endNode.type == 'block') {
    parseSelf(endNode.exp)
  } else if (endNode.type == 'nest') {
    parseSelf(endNode.body)
  } else if (endNode.type == 'infix') {
    //在中缀里
    parseSelf(endNode.left)
    parseOne(endNode.infix, list, parseSelf)
    parseSelf(endNode.right)
  } else {
    throw new Error('unknown type')
  }
}
export const toFillToken = endNotFillToToken<EndNode, EndNode, DisplayValue>(
  parseOne,
  parseOne,
  unsafeAdd('white')
)
