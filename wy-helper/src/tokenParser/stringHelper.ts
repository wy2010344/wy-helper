import { emptyArray, quote } from "../util"
import { Que, andMatch, andRuleGet, manyMatch, manyRuleGet, matchAnyString, matchCharNotIn, matchEnd, matchToEnd, orMatch, orRuleGet, ruleGet } from "./tokenParser"


export const anyChar = matchCharNotIn()
export function ruleStrBetween(begin: string, end = begin) {
  const matchTheEnd = matchToEnd(end)
  return andMatch(
    matchAnyString(begin),
    manyMatch(
      orMatch(
        matchAnyString('\\\\'),
        matchAnyString(`\\${end[0]}`),
        anyChar
      ),
      0,
      matchTheEnd,
      matchTheEnd
    ),
    //可能结束了,但没有闭合
    orMatch(
      matchEnd,
      matchAnyString(end)
    )
  )
}

export function ruleStrBetweenGet(
  begin: string,
  end = begin,
) {

  const matchTheEnd = matchToEnd(end)
  return andRuleGet(
    [
      ruleGet<Que, Que>(matchAnyString(begin), quote),
      manyRuleGet(
        orRuleGet(
          [
            ruleGet(matchAnyString('\\\\'), function (que) {
              return '\\'
            }),
            ruleGet(matchAnyString(`\\${end[0]}`), function (que) {
              return end[0]
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
        matchAnyString(end)
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