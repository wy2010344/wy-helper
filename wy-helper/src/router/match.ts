
import { KVPair } from "../KVPair"
import { ruleGetString, manyMatch, matchCharNotIn, ruleGet, Que, manyRuleGet, andMatch, andRuleGet, matchCharIn, orRuleGet, alawaysGet, ParserSuccess } from "../tokenParser"
import { quote } from "../util"

export type MatchNode = string | {
  before: string
  key: string
  type(v: string): any
  next: MatchNode
}
const QuoteLeft = '['.charCodeAt(0)
const QuoteRight = ']'.charCodeAt(0)
const Colon = ':'.charCodeAt(0)
const matchNotChat = matchCharNotIn(QuoteLeft, QuoteRight)
const matchNotChatColon = matchCharNotIn(QuoteLeft, QuoteRight, Colon)
const getStr0 = ruleGet<Que, string>(
  manyMatch(
    matchNotChat,
  ),
  ruleGetString
)
const ruleGetKey = ruleGet<Que, string>(manyMatch(
  matchNotChatColon,
  1
), ruleGetString)
/**
 * [abc]
 * [avd:dds]
 */
const getQuote = andRuleGet(
  [
    ruleGet(matchCharIn(QuoteLeft), quote),
    ruleGetKey,
    orRuleGet(
      [
        andRuleGet(
          [
            ruleGet(matchCharIn(Colon), quote),
            ruleGetKey
          ],
          function (a, b) {
            return b
          }
        ),
        alawaysGet()
      ],
    ),
    ruleGet(matchCharIn(QuoteRight), quote)
  ],
  function (a, b, c, d) {
    return [b, c] as const
  }
)


const parseRule = andRuleGet([
  manyRuleGet(
    andRuleGet(
      [
        getStr0,
        getQuote
      ],
      function (a, b) {
        return {
          begin: a,
          key: b[0],
          type: b[1]
        }
      }
    )
  ),
  getStr0
], function (a, b) {
  return {
    before: a,
    last: b
  }
})


export function matchMatch(query: string, match: MatchNode, args?: KVPair<any>) {
  let idx = 0
  while (match) {
    if (typeof match == 'string') {
      if (query == match) {
        return args
      } else {
        throw new Error(`${query}不是以${match}结束`)
      }
    } else {
      if (query.startsWith(match.before, idx)) {
        const next = match.next
        let afterFlag = ''
        if (typeof next == 'string') {
          afterFlag = next
        } else {
          afterFlag = next.before
        }
        let value = ''
        if (afterFlag) {
          const nextIdx = query.indexOf(afterFlag, match.before.length + idx)
          if (nextIdx < 0) {
            throw new Error(`${query.slice(match.before.length + idx)}未找到${afterFlag}的分割`)
          }
          value = query.slice(idx + match.before.length, nextIdx)
          idx = nextIdx + afterFlag.length - 1
        } else {
          value = query.slice(idx + match.before.length)
        }
        args = new KVPair(match.key, match.type(value), args)
        match = match.next
      } else {
        throw new Error(`${query.slice(match.before.length + idx)}不是以${match.before}开始`)
      }
    }
  }
  return args
}

export function toMatchNode(node: string, typeDefMap: Record<string, (v: string) => any>) {
  const abc = parseRule(new Que(node))
  if (abc instanceof ParserSuccess) {
    if (abc.end.notEnd()) {
      throw new Error('未匹配到结束')
    }
    const nodes = abc.value
    let ret: MatchNode = nodes.last
    for (let i = nodes.before.length - 1; i > -1; i--) {
      const node = nodes.before[i]
      if (i != 0) {
        if (!node.begin.length) {
          throw new Error('两个[]之间不允许为空')
        }
      }
      let type: any = quote
      if (node.type) {
        type = typeDefMap[node.type]
        if (!type) {
          throw new Error('未定义type:' + node.type)
        }
      }
      ret = {
        next: ret,
        before: node.begin,
        key: node.key,
        type
      }
    }
    return ret
  }
  throw abc
}




