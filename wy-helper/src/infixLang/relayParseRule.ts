import {
  Que, andMatch, isChinese,
  isFloat, isLowerEnglish,
  isNumber, isUpperEnglish, manyMatch,
  matchAnyString, orMatch,
  parseGet, parseSkip, ruleStrBetween, ruleStrBetweenGet1,
  whiteSpaceMatch
} from "../tokenParser";

export const matchCommonExt = manyMatch(
  orMatch(
    isUpperEnglish.matchCharBetween(),
    isLowerEnglish.matchCharBetween(),
    isNumber.matchCharBetween(),
    isChinese.matchCharBetween()
  )
)

export const symbolRule = andMatch(
  orMatch(
    isLowerEnglish.matchCharBetween(),
    isChinese.matchCharBetween('某'.charCodeAt(0)),
  ),
  matchCommonExt
)
const varRule = andMatch(
  orMatch(
    isUpperEnglish.matchCharBetween(),
    matchAnyString('某'),
    matchAnyString('_')
  ),
  matchCommonExt
)

export function ruleGetNumber() {
  return parseGet<Que, NumberToken>(isFloat, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "number",
      begin: begin.i,
      end: end.i,
      errors: [],
      value: Number(value),
      originalValue: value
    } as NumberToken
  }, 'number')

}
export function ruleGetString() {
  const [value, begin, end] = ruleStrBetweenGet1("'".charCodeAt(0))
  const originalValue = begin.content.slice(begin.i, end.i)

  return {
    type: "string",
    value,
    originalValue,
    begin: begin.i,
    end: end.i
  } as StringToken
}

const ruleComment = ruleStrBetween('"'.charCodeAt(0))
export const ruleSkipWhiteOrComment = manyMatch(
  orMatch(
    ruleComment,
    whiteSpaceMatch
  )
)
export const ruleSkipWhiteOrCommentMin1 = manyMatch(
  orMatch(
    ruleComment,
    whiteSpaceMatch
  ),
  1
)
export function skipWhiteOrComment(atLeastOne?: boolean) {
  if (atLeastOne) {
    parseSkip(ruleSkipWhiteOrCommentMin1)
  } else {
    parseSkip(ruleSkipWhiteOrComment)
  }
}

export function ruleGetSymbol() {
  return parseGet<Que, SymbolToken>(symbolRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "symbol",
      begin: begin.i,
      end: end.i,
      errors: [],
      value
    } as SymbolToken
  }, 'symbol')
}
export function ruleGetVar() {
  return parseGet<Que, VarToken>(varRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "var",
      begin: begin.i,
      end: end.i,
      errors: [],
      value
    } as VarToken
  }, 'var')
}

export interface Token {
  begin: number
  end: number
}

export interface StringToken extends Token {
  type: "string"
  originalValue: string
  value: string
}

export interface VarToken extends Token {
  type: "var"
  value: string
}

export interface SymbolToken extends Token {
  type: "symbol"
  value: string
}

export interface NumberToken extends Token {
  type: "number"
  value: number
  originalValue: string
}