import { parseSkip } from "./parse";
import { CharRange, andMatch, manyMatch, matchAnyString, matchEnd, orMatch, orMatchEmpty, whiteSpaceRule, whiteSpaceRuleZero } from "./tokenParser";




function getCharCode(n: string) {
  return n.charCodeAt(0)
}

export const isLowerEnglish = CharRange.of(getCharCode('a'), getCharCode('z'))
export const isUpperEnglish = CharRange.of(getCharCode('A'), getCharCode('Z'))
export const isChinese = CharRange.of(getCharCode('\u4e00'), getCharCode('\u9fa5'))
export const isNumber = CharRange.of(getCharCode('0'), getCharCode('9'))



export const isInteger = orMatch(
  andMatch(
    isNumber.matchCharBetween(getCharCode('0')),
    manyMatch(isNumber.matchCharBetween())
  ),
  isNumber.matchCharBetween(),
)

export const isFloat = andMatch(
  isInteger,
  orMatchEmpty(
    andMatch(
      matchAnyString('.'),
      manyMatch(isNumber.matchCharBetween(), 1)
    )
  )
)


export function skipWhiteSpace(atLeastOne?: boolean) {
  if (atLeastOne) {
    parseSkip(whiteSpaceRule)
  } else {
    parseSkip(whiteSpaceRuleZero)
  }
}


export function skipAnyString(...vs: string[]) {
  parseSkip(matchAnyString(...vs), vs.join(','))
}

export function skipMatchEnd() {
  parseSkip(matchEnd)
}