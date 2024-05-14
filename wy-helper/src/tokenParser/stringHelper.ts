import { emptyFun, quote } from "../util"
import { getCurrentQue, or, parseGet, parseSkip } from "./parse"
import { Que, andMatch, andRuleGet, manyMatch, manyRuleGet, matchAnyString, matchCharIn, matchCharNotIn, matchEnd, matchToEnd, orMatch, orRuleGet, ruleGet } from "./tokenParser"


export const anyChar = matchCharNotIn()


export function ruleStrBetweenGet1(
  begin: number,
  end: number = begin
) {
  const beginQue = getCurrentQue() as Que
  parseSkip(matchCharIn(begin))
  const endChar = String.fromCharCode(end)
  const list: string[] = []
  while (true) {
    const value = or([
      () => {
        return parseGet(matchAnyString('\\\\'), () => '\\')
      },
      () => {
        return parseGet(matchAnyString(`\\${endChar}`), () => endChar)
      },
      () => {
        return parseGet(matchCharNotIn(end), begin => begin.current())
      },
      emptyFun
    ])
    if (value) {
      list.push(value)
    } else {
      break
    }
  }
  parseSkip(matchCharIn(end))
  const endQue = getCurrentQue() as Que
  return [list.join(''), beginQue, endQue] as const
}

export function ruleStrBetween(begin: number, end = begin) {
  const endChar = String.fromCharCode(end)
  const matchTheEnd = matchToEnd(endChar)
  return andMatch(
    matchCharIn(begin),
    manyMatch(
      orMatch(
        matchAnyString('\\\\'),
        matchAnyString(`\\${endChar}`),
        anyChar
      ),
      0,
      matchTheEnd,
      matchTheEnd
    ),
    //可能结束了,但没有闭合
    orMatch(
      matchEnd,
      matchCharIn(end)
    )
  )
}

export function ruleStrBetweenGet(
  begin: number,
  end = begin,
) {
  const endChar = String.fromCharCode(end)
  const matchTheEnd = matchToEnd(endChar)
  return andRuleGet(
    [
      ruleGet<Que, Que>(matchCharIn(begin), quote),
      manyRuleGet(
        orRuleGet(
          [
            ruleGet(matchAnyString('\\\\'), function (que) {
              return '\\'
            }),
            ruleGet(matchAnyString(`\\${endChar}`), function (que) {
              return endChar
            }),
            ruleGet(anyChar, function (que) {
              return que.content[que.i]
            })
          ]
        ),
        0,
        matchTheEnd,
        matchTheEnd
      ),
      //可能结束了,但没有闭合
      ruleGet(orMatch(
        matchEnd,
        matchCharIn(end)
      ), quote)
    ],
    function (a, b, c) {
      return b.join('')
    }
  )
}



export function ruleStrBetweenPart(
  begin: string,
  inBegin: string,
  inEnd: string,
  end = begin
) {
  const matchTheEnd = matchToEnd(inBegin, end)
  return andMatch(
    orMatch(
      matchAnyString(begin),
      matchAnyString(inEnd),
    ),
    manyMatch(
      orMatch(
        matchAnyString('\\\\'),//+2
        matchAnyString(`\\${end[0]}`),//+1
        matchAnyString(`\\${inBegin[0]}`),//+1
        anyChar,//每次加1
      ),
      0,
      matchTheEnd,
      matchTheEnd
    ),
    //可能结束了,但没有闭合
    orMatch(
      matchEnd,
      matchAnyString(end),
      matchAnyString(inBegin)
    )
  )
}



export function ruleStrBetweenPartGet(
  begin: string,
  inBegin: string,
  inEnd: string,
  end = begin
) {
  const matchTheEnd = matchToEnd(inBegin, end)
  return andRuleGet(
    [
      ruleGet(
        orMatch(
          matchAnyString(begin),
          matchAnyString(inEnd),
        ),
        quote
      ),
      manyRuleGet(
        orRuleGet(
          [
            ruleGet(matchAnyString('\\\\'), v => '\\'),
            ruleGet(matchAnyString(`\\${end[0]}`), v => end[0]),
            ruleGet(matchAnyString(`\\${inBegin[0]}`), v => inBegin[0]),
            ruleGet(anyChar, function (que) {
              return que.content[que.i]
            })
          ]
        ),
        0,
        matchTheEnd,
        matchTheEnd
      ),
      ruleGet(
        orMatch(
          matchEnd,
          matchAnyString(end),
          matchAnyString(inBegin)
        ),
        quote
      )
    ],
    function (a, b, c) {
      return b.join('')
    }
  )
}