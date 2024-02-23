/**
 * 简单的xml解析,主要是用于i18n
 * dafew dfawe <xm />
 * efawe <dd csd dsfe="dd">dfwef</df>
 * 
 * 应该视着以字符串开始 然后以尖括号开始
 */

import { ruleStrBetweenGet } from ".";
import { quote } from "..";
import { ParseFunGet, Que, alawaysGet, andMatch, andRuleGet, isParseSuccess, manyMatch, manyRuleGet, match, matchBetween, matchEnd, matchToEnd, notMathChar, orMatch, orRuleGet, reduceRuleGet, ruleGet, ruleGetString, ruleGetTranslate, whiteSpaceRuleZero } from "./tokenParser";

function getCharCode(n: string) {
  return n.charCodeAt(0)
}

export const isLowerEnglish = matchBetween<Que>(getCharCode('a'), getCharCode('z'))
export const isUpperEnglish = matchBetween<Que>(getCharCode('A'), getCharCode('Z'))
export const isChinese = matchBetween<Que>(getCharCode('\u4e00'), getCharCode('\u9fa5'))
export const isNumber = matchBetween<Que>(getCharCode('0'), getCharCode('9'))


/**
 * 这里,使用大小写英文开头,后面仍然为英文,可以有数字
 */
const isPureWord = andMatch(
  orMatch(
    isUpperEnglish,
    isLowerEnglish
  ),
  manyMatch(
    orMatch(
      isUpperEnglish,
      isLowerEnglish,
      isNumber
    )
  )
)



type AttrMap = {
  [key in string]: string | true
}
class XmlBeginNode {
  constructor(
    public readonly key: string,
    public readonly map: AttrMap,
    public readonly close: boolean
  ) { }
}
class XmlEndNode {
  constructor(
    public readonly key: string
  ) { }
}

const matchTheEnd = matchToEnd('<')
/**
 * 匹配纯字符串区域
 */
const matchInlineContent = ruleGetTranslate(manyRuleGet(
  orRuleGet(
    ruleGet(match('\\\\'), v => '\\'),
    ruleGet(match(`\\<`), v => '<'),
    ruleGet(notMathChar(), function (que) {
      return que.content[que.i]
    })
  ),
  0,
  matchTheEnd,
  matchTheEnd
), function (vs) {
  return vs.join('')
})

function getStrValue(a: Que, b: Que) {
  return ruleGetString(a, b)
}

/**
 * xml参数
 */
const argRuleGet: ParseFunGet<Que, {
  key: string
  value: string | true
}> = andRuleGet(
  [
    ruleGet(isPureWord, getStrValue),
    orRuleGet(
      andRuleGet(
        [
          ruleGet(match('='), quote),
          ruleStrBetweenGet('"')
        ],
        function (a, b) {
          return b
        }
      ),
      alawaysGet(() => true as const)
    )
  ],
  function (a, b) {
    return {
      key: a,
      value: b
    }
  }
)

const matchBracket: ParseFunGet<Que, XmlBeginNode> = andRuleGet(
  [
    ruleGet(match('<'), quote),
    ruleGet(isPureWord, ruleGetString),
    ruleGet(whiteSpaceRuleZero, quote),
    manyRuleGet(
      argRuleGet,
      0,
      whiteSpaceRuleZero
    ),
    ruleGet(whiteSpaceRuleZero, quote),
    ruleGet(
      match(">", "/>"),
      ruleGetString
    )
  ],
  function (a, b, c, d, e, f) {
    const map: AttrMap = {}
    for (let x of d) {
      if (x.key in map) {
        throw `duplicate key ${x.key}`
      }
      map[x.key] = x.value
    }
    return new XmlBeginNode(b, map, f == '/>')
  }
)



const matchBracketEnd = andRuleGet(
  [
    ruleGet(match('</'), quote),
    ruleGet(isPureWord, ruleGetString),
    ruleGet(match('>'), quote),
  ],
  function (a, b, c) {
    return new XmlEndNode(b)
  }
)


const parseXml = reduceRuleGet(
  ruleGetTranslate(matchInlineContent, v => {
    const last = new XmlNode("", {}, [])
    if (v) {
      last.children.push(v)
    }
    return [last] as XmlNode[]
  }),
  andRuleGet(
    [
      orRuleGet(
        matchBracket,
        matchBracketEnd
      ),
      matchInlineContent
    ],
    function (a, b) {
      return {
        brack: a,
        content: b
      }
    }
  ),
  function (init, { brack, content }) {
    let last = init.at(-1)
    if (!last) {
      return
    }
    if (brack instanceof XmlBeginNode) {
      if (brack.close) {
        last.children.push(new XmlNode(brack.key, brack.map, []))
      } else {
        const newNode = new XmlNode(brack.key, brack.map, [])
        last.children.push(newNode)
        init.push(newNode)
        last = newNode
      }
    } else if (brack instanceof XmlEndNode) {
      if (last.type != brack.key) {
        throw 'not match the before quote'
      }
      init.pop()
      last = init.at(-1)
    } else {
      throw 'unknown node' + brack
    }
    if (!last) {
      throw 'unexpected end!'
    }
    if (content) {
      last.children.push(content)
    }
    return init
  }
)

export class XmlNode {
  constructor(
    public readonly type: string,
    public readonly attrs: AttrMap,
    public readonly children: AllXmlNode[]
  ) { }
}

export type AllXmlNode = string | XmlNode
export function toXmlNodes(text: string) {
  const out = parseXml(new Que(text))
  if (isParseSuccess(out)) {
    if (out.end.i == out.end.content.length) {
      const v = out.value
      if (v.length == 1) {
        return v[0].children
      } else {
        throw new Error('not completely closed')
      }
    } else {
      throw new Error('Unable to fully parse')
    }
  }
  throw new Error(out.message)
}




function getTransRC<T>(toSingle: ToSingle<T>) {
  return function transRC(list: AllXmlNode[], getDefine: GetDefine<T>): T {
    return toSingle(
      list.map((row) => {
        if (row instanceof XmlNode) {
          return getDefine(row.type, {
            attrs: row.attrs,
            children: transRC(row.children, getDefine)
          })
        } else {
          return row
        }
      })
    );
  };
}

export type XMLParams<T> = {
  attrs: AttrMap;
  children: T;
};
const cacheMap = new Map<string, AllXmlNode[]>();
function getElements(xml: string, noCache?: boolean) {
  const old = cacheMap.get(xml);
  if (old) {
    return old;
  } else {
    const nodes = toXmlNodes(xml)
    if (!noCache) {
      cacheMap.set(xml, nodes);
    }
    return nodes;
  }
}
export type GetDefine<T> = (tag: string, value: XMLParams<T>) => T | string;
export type ToSingle<T> = (v: (T | string)[]) => T;
export function getRenderXMLFun<T>(toSingle: ToSingle<T>, noCache?: boolean) {
  const transRC = getTransRC(toSingle);
  return function (xml: string, getDefine: GetDefine<T>) {
    return transRC(getElements(xml, noCache), getDefine);
  }
}