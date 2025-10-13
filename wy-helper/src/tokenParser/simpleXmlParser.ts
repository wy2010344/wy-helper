/**
 * 简单的xml解析,主要是用于i18n
 * dafew dfawe <xm />
 * efawe <dd csd dsfe="dd">dfwef</df>
 *
 * 应该视着以字符串开始 然后以尖括号开始
 */

import { ruleStrBetweenGet } from '.';
import { quote } from '..';
import {
  ParseFunGet,
  Que,
  alawaysGet,
  andMatch,
  andRuleGet,
  isParseSuccess,
  manyMatch,
  manyRuleGet,
  matchAnyString,
  matchCharNotIn,
  matchToEnd,
  orMatch,
  orRuleGet,
  reduceRuleGet,
  ruleGet,
  ruleGetString,
  ruleGetTranslate,
  ruleSkip,
  whiteSpaceRuleZero,
} from './tokenParser';
import { isLowerEnglish, isNumber, isUpperEnglish } from './util';

/**
 * 这里,使用大小写英文开头,后面仍然为英文,可以有数字
 */
const isPureWord = andMatch(
  orMatch(isUpperEnglish.matchCharBetween(), isLowerEnglish.matchCharBetween()),
  manyMatch(
    orMatch(
      isUpperEnglish.matchCharBetween(),
      isLowerEnglish.matchCharBetween(),
      isNumber.matchCharBetween()
    )
  )
);

type AttrMap = {
  [key in string]: string | true;
};
class XmlBeginNode {
  constructor(
    public readonly key: string,
    public readonly map: AttrMap,
    public readonly close: boolean
  ) {}
}
class XmlEndNode {
  constructor(public readonly key: string) {}
}

const matchTheEnd = matchToEnd('<');
/**
 * 匹配纯字符串区域
 */
const matchInlineContent = ruleGetTranslate(
  manyRuleGet(
    orRuleGet([
      ruleGet(matchAnyString('\\\\'), v => '\\'),
      ruleGet(matchAnyString(`\\<`), v => '<'),
      ruleGet(matchCharNotIn(), que => que.current()),
    ]),
    0,
    matchTheEnd,
    matchTheEnd
  ),
  function (vs) {
    return vs.join('');
  }
);

export function generateParseXml(
  //类型解析
  ruleGetType: ParseFunGet<Que, string>,
  //属性参数key
  ruleGetKey: ParseFunGet<Que, string>,
  //属性value
  ruleGetValue: ParseFunGet<Que, string>
) {
  /**
   * xml参数
   */
  const argRuleGet: ParseFunGet<
    Que,
    {
      key: string;
      value: string | true;
    }
  > = andRuleGet(
    [
      ruleGetKey,
      orRuleGet([
        andRuleGet(
          [ruleGet(matchAnyString('='), quote), ruleGetValue],
          function (a, b) {
            return b;
          }
        ),
        alawaysGet(() => true as const),
      ]),
    ],
    function (a, b) {
      return {
        key: a,
        value: b,
      };
    }
  );

  const matchBracket: ParseFunGet<Que, XmlBeginNode> = andRuleGet(
    [
      ruleGet(matchAnyString('<'), quote),
      ruleGetType,
      ruleGet(whiteSpaceRuleZero, quote),
      manyRuleGet(argRuleGet, 0, whiteSpaceRuleZero),
      ruleGet(whiteSpaceRuleZero, quote),
      ruleGet(matchAnyString('>', '/>'), ruleGetString),
    ],
    function (a, b, c, d, e, f) {
      const map: AttrMap = {};
      for (const x of d) {
        if (x.key in map) {
          throw `duplicate key ${x.key}`;
        }
        map[x.key] = x.value;
      }
      return new XmlBeginNode(b, map, f == '/>');
    }
  );

  const matchBracketEnd = andRuleGet(
    [
      ruleSkip(matchAnyString('</')),
      ruleGetType,
      ruleSkip(matchAnyString('>')),
    ],
    function (a, b, c) {
      return new XmlEndNode(b);
    }
  );

  const parseXml = reduceRuleGet(
    ruleGetTranslate(matchInlineContent, v => {
      const last = new XmlNode('', {}, []);
      if (v) {
        last.children.push(v);
      }
      return [last] as XmlNode[];
    }),
    andRuleGet(
      [orRuleGet([matchBracket, matchBracketEnd]), matchInlineContent],
      function (a, b) {
        return {
          brack: a,
          content: b,
        };
      }
    ),
    function (init, { brack, content }) {
      let last = init.at(-1);
      if (!last) {
        return;
      }
      if (brack instanceof XmlBeginNode) {
        if (brack.close) {
          last.children.push(new XmlNode(brack.key, brack.map, []));
        } else {
          const newNode = new XmlNode(brack.key, brack.map, []);
          last.children.push(newNode);
          init.push(newNode);
          last = newNode;
        }
      } else if (brack instanceof XmlEndNode) {
        if (last.type != brack.key) {
          throw 'not match the before quote';
        }
        init.pop();
        last = init.at(-1);
      } else {
        throw `unknown node${brack}`;
      }
      if (!last) {
        throw 'unexpected end!';
      }
      if (content) {
        last.children.push(content);
      }
      return init;
    }
  );

  return parseXml;
}

export class XmlNode {
  constructor(
    public readonly type: string,
    public readonly attrs: AttrMap,
    public readonly children: AllXmlNode[]
  ) {}
}

const simplePureWord = ruleGet(isPureWord, ruleGetString);
const defaultParseXML = generateParseXml(
  simplePureWord,
  simplePureWord,
  ruleStrBetweenGet('"'.charCodeAt(0))
);

export type AllXmlNode = string | XmlNode;
export function toXmlNodes(text: string, parseXml = defaultParseXML) {
  const out = parseXml(new Que(text));
  if (isParseSuccess(out)) {
    if (out.end.i == out.end.content.length) {
      const v = out.value;
      if (v.length == 1) {
        return v[0].children;
      } else {
        throw new Error('not completely closed');
      }
    } else {
      throw new Error('Unable to fully parse');
    }
  }
  throw new Error(out.message);
}

function getTransRC<T>(toSingle: ToSingle<T>) {
  return function transRC(list: AllXmlNode[], getDefine: GetDefine<T>): T {
    return toSingle(
      list.map(row => {
        if (row instanceof XmlNode) {
          return getDefine(row.type, {
            attrs: row.attrs,
            children: transRC(row.children, getDefine),
          });
        } else {
          return row;
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
    const nodes = toXmlNodes(xml);
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
  };
}
