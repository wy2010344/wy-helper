import { quote } from "../util"
import { Que, andMatch, andRuleGet, manyMatch, manyRuleGet, match, matchEnd, matchToEnd, notMathChar, orMatch, orRuleGet, ruleGet } from "./tokenParser"

export function ruleStrBetween(begin: string, end = begin) {
  const matchTheEnd = matchToEnd(end)
  return andMatch(
    match(begin),
    manyMatch(
      orMatch(
        match('\\\\'),
        match(`\\${end[0]}`),
        notMathChar()
      ),
      {
        first: matchTheEnd,
        between: matchTheEnd
      }
    ),
    //可能结束了,但没有闭合
    orMatch(
      matchEnd,
      match(end)
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
      ruleGet<Que, Que>(match(begin), quote),
      manyRuleGet(
        orRuleGet(
          ruleGet(match('\\\\'), function (que) {
            return '\\'
          }),
          ruleGet(match(`\\${end[0]}`), function (que) {
            return end[0]
          }),
          ruleGet(notMathChar(), function (que) {
            return que.content[que.i]
          })
        ),
        {
          between: matchTheEnd,
          first: matchTheEnd
        }
      ),
      //可能结束了,但没有闭合
      ruleGet(orMatch(
        matchEnd,
        match(end)
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
      match(begin),
      match(inEnd),
    ),
    manyMatch(
      orMatch(
        match('\\\\'),//+2
        match(`\\${end[0]}`),//+1
        match(`\\${inBegin[0]}`),//+1
        notMathChar(),//每次加1
      ),
      {
        //每次预先检查,符合则跳出.
        first: matchTheEnd,
        between: matchTheEnd
      }
    ),
    //可能结束了,但没有闭合
    orMatch(
      matchEnd,
      match(end),
      match(inBegin)
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
          match(begin),
          match(inEnd),
        ),
        quote
      ),
      manyRuleGet(
        orRuleGet(
          ruleGet(match('\\\\'), v => '\\'),
          ruleGet(match(`\\${end[0]}`), v => end[0]),
          ruleGet(match(`\\${inBegin[0]}`), v => inBegin[0]),
          ruleGet(notMathChar(), function (que) {
            return que.content[que.i]
          })
        ),
        {
          between: matchTheEnd,
          first: matchTheEnd
        }
      ),
      ruleGet(
        orMatch(
          matchEnd,
          match(end),
          match(inBegin)
        ),
        quote
      )
    ],
    function (a, b, c) {
      return b.join('')
    }
  )
}