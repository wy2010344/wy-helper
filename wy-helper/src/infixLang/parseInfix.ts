import { List } from '../kanren';
import { EmptyFun, emptyFun } from '../util';
import { or, parseGet } from '../tokenParser/parse';
import {
  ParseFun,
  Que,
  matchAnyString,
  ruleGetString,
} from '../tokenParser/tokenParser';

export type Infix<T> = {
  (): T;
}; //string | MatchGet
/**
 * 从后往前结合
 */
export type RevInfix<T> = {
  type: 'rev';
  values: Infix<T>[];
};
export type InfixConfig<T> = Infix<T>[] | RevInfix<T>;

function parseInfixBB<F, I>(
  parseLeaf: () => F,
  parseInfix: (() => I)[],
  // infixes: Infix[],
  skipWhiteSpace: EmptyFun
) {
  const first = parseLeaf();
  const exts: {
    infix: I;
    value: F;
  }[] = [];
  while (true) {
    const hasValue = or([
      () => {
        skipWhiteSpace();
        const infix = or(parseInfix);
        // const infix = or(
        //   infixes.map((value) => {
        //     if (typeof value == 'string') {
        //       return parseInfixStr(value)
        //     } else {
        //       return parseInfixNode(value)
        //     }
        //   })
        // )
        skipWhiteSpace();
        const right = parseLeaf(); //
        exts.push({
          infix,
          value: right,
        });
        return true;
      },
      emptyFun,
    ]);
    if (!hasValue) {
      break;
    }
  }
  return { first, exts };
}

/**
 * 未经测试
 * @param infixes
 * @param parseLeaf
 * @returns
 */
// export function parseSuffix<F>(
//   infixes: Infix[],
//   parseLeaf: () => F,
//   skipWhiteSpace: EmptyFun
// ) {
//   const exts: {
//     value: F
//     infix: InfixToken
//   }[] = []
//   while (true) {
//     const hasValue = or(
//       [
//         () => {
//           skipWhiteSpace()
//           const right = parseLeaf() //
//           skipWhiteSpace()
//           const infix = or(
//             infixes.map((value) => {
//               if (typeof value == 'string') {
//                 return parseInfixStr(value)
//               } else {
//                 return parseInfixNode(value)
//               }
//             })
//           )
//           exts.push({
//             infix,
//             value: right,
//           })
//           return true
//         },
//         emptyFun,
//       ],
//       `infix:${infixes
//         .map((v) => {
//           if (typeof v == 'string') {
//             return v
//           } else {
//             return v.display
//           }
//         })
//         .join(' ')}`
//     )
//     if (!hasValue) {
//       break
//     }
//   }
//   return exts
// }

/**
 * 左结合
 * @param parseLeaf
 * @param value
 */
export function parseInfixBLeft<F, T, I>(
  parseLeaf: () => F,
  parseInfix: Infix<I>[],
  skipWhiteSpace: EmptyFun,
  build: (infix: I, left: F | T, right: F) => T
) {
  const { first, exts } = parseInfixBB(parseLeaf, parseInfix, skipWhiteSpace);
  let value = first as F | T;
  for (let i = 0; i < exts.length; i++) {
    const ext = exts[i];
    value = build(ext.infix, value, ext.value);
  }
  return value;
}
/**
 * 右结合
 * @param parseLeaf
 * @param value
 */
export function parseInfixBRight<F, T, I>(
  parseLeaf: () => F,
  parseInfix: Infix<I>[],
  skipWhiteSpace: EmptyFun,
  build: (infix: I, left: F, right: F | T) => T
) {
  const { first, exts } = parseInfixBB(parseLeaf, parseInfix, skipWhiteSpace);
  if (exts.length) {
    let { value: tmpValue, infix } = exts[exts.length - 1];
    let value = tmpValue as F | T;
    for (let i = exts.length - 2; i > -1; i--) {
      const ext = exts[i];
      value = build(infix, ext.value, value);
      infix = ext.infix;
    }
    value = build(infix, first, value);
    return value;
  }
  return first;
}
/**
 * 默认是向后组装的
 * 但需要向前组装
 * @param infixs
 * @param parseNode
 * @returns
 */
export function parseInfix<T, I>(
  infixes: List<InfixConfig<I>>,
  skipWhiteSpace: EmptyFun,
  parseNode: () => T,
  build: (infix: I, left: T, right: T) => T
): T {
  if (!infixes) {
    return parseNode();
  }
  const c = infixes.left;
  const parseLeaf = () =>
    parseInfix(infixes.right, skipWhiteSpace, parseNode, build);
  if (Array.isArray(c)) {
    return parseInfixBLeft(parseLeaf, c, skipWhiteSpace, build);
  } else {
    return parseInfixBRight(parseLeaf, c.values, skipWhiteSpace, build);
  }
}

/**
 *
 * @param pOrder 父层级的order
 * @param order 自身的order
 * @param onLeft 自身在父层级是否是左边
 * @returns
 */
export function infixRightNeedQuote(
  pOrder: number,
  order: number,
  onLeft?: boolean
) {
  if (pOrder > order) {
    return true;
  } else if (pOrder < order) {
    return false;
  } else if (onLeft) {
    return true;
  } else {
    return false;
  }
}
// export type AInfixNode<T> = {
//   type: "infix"
//   infix: InfixToken
//   left: AllEndNode<T>
//   right: AllEndNode<T>
// }
// export type APrefixNode<T> = {
//   type: "prefix"
//   prefix: InfixToken
//   value: AllEndNode<T>
// }
// export type ASuffixNode<T> = {
//   type: "suffix"
//   suffix: InfixToken
//   value: AllEndNode<T>
// }
// type AllEndNode<T> = T | InfixNode<T> | APrefixNode<T> | ASuffixNode<T>
// export function parseAll<T>() {

// }
/**
 * A + nil = A;
(H:A) + B = (H:C) :- A + B = C;
ni
 * @param v
 * @returns
 */
/**
 * va = x -> ab:98;
ac = y -> x -> f -> f:x:y
 */

// export type InfixSimplify = [
//   InfixSimplify,
//   string,
//   InfixSimplify
// ] | string | number

// /**
//  * 如果子成员都是纯值,则不换行
//  * 如果有一个子成员不是,则换行
//  * @param v
//  * @returns
//  */
// export function logInfixSimplify(v: InfixSimplify, indent = 0): string {
//   if (Array.isArray(v)) {
//     const vs = v.map(x => logInfixSimplify(x))
//     if (v.every(v => !Array.isArray(v))) {
//       return `[${vs.join(' ')}]`
//     } else {
//       return `[${vs.join(' ')}]`
//     }
//   } else {
//     return v + ""
//   }
// }
