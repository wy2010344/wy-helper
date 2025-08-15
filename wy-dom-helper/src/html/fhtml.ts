

import { emptyFun, genTemplateStringS1, genTemplateStringS2, GetValue, objectDiffDeleteKey, SetValue, SyncFun, ValueOrGet, VType, vTypeisGetValue } from "wy-helper";
import { PureCSSProperties } from "../util";
import { BDomAttribute, BSvgAttribute, DomElementType, React, SvgElementType } from "./html";
import { addEvent, isEvent, mergeEvent, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, UpdateProp, updateStyle, updateSvg } from "./fx";
import { isSyncFun, Props } from "./updateDom";

export type FDataAttr = {
  [key in `data_${string}`]?: string | number | boolean
}

// type FDomAttributeCS<T extends DomElementType> = {
//   [key in keyof FDomAttributeC<T> as (key extends string ? `a_${key}` : key)]: FDomAttributeC<T>[key]
// }


// type FSvgAttributeCS<T extends SvgElementType> = {
//   [key in keyof FSvgAttributeC<T> as (key extends string ? `a_${key}` : key)]: FSvgAttributeC<T>[key]
// }


export type FCssVaribute = {
  [key in `css_${string}`]?: string | number | boolean
}
type FStyleProps = {
  [key in keyof PureCSSProperties as `s_${key}`]: PureCSSProperties[key]
}

type FReplaceAria<Key> = Key extends string
  ? Key extends `${infer Prefix}-${infer Suffix}`
  ? `${Prefix}_${Suffix}`
  : Key
  : Key;

export type FAriaAttribute = {
  [key in keyof React.AriaAttributes as FReplaceAria<key>]: React.AriaAttributes[key]
}



export type FDomAttribute<T extends DomElementType> =
  BDomAttribute<T>
  & FDataAttr
  & FAriaAttribute
  & FStyleProps
  & FCssVaribute

export type FSvgAttribute<T extends SvgElementType> =
  BSvgAttribute<T>
  & FDataAttr
  & FAriaAttribute
  & FStyleProps
  & FCssVaribute

export type FGetChildAttr<T> = {
  childrenType: "text"
  children: ValueOrGet<number | string>
} | {
  childrenType: "html"
  children: ValueOrGet<number | string>
} | {
  childrenType?: never
  children?: CommonChildrenType<T>
}


export type CommonChildrenType<T> = SetValue<T> | GetChild | number | string
export interface GetChild {
  type: 'text' | 'html'
  (): string | number
}

export function toGetText(fun: GetValue<string | number>) {
  const abc = fun as GetChild
  abc.type = 'text'
  return abc
}

export function toText(ts: TemplateStringsArray, ...vs: VType[]) {
  if (vs.some(vTypeisGetValue)) {
    return toGetText(() => {
      return genTemplateStringS2(ts, vs)
    })
  } else {
    return genTemplateStringS1(ts, vs as any)
  }
}

export function toGetHtml(fun: GetValue<string | number>) {
  const abc = fun as GetChild
  abc.type = 'html'
  return abc
}

export function toHtml(ts: TemplateStringsArray, ...vs: VType[]) {
  return toGetHtml(() => {
    return genTemplateStringS2(ts, vs)
  })
}

export function renderFGetChildAttr<T>(
  node: Node,
  arg: FGetChildAttr<T>,
  mergeValue: MergeValue,
  renderPortal: (n: Node, children: SetValue<Node>) => void,
) {
  if (arg.childrenType == 'text') {
    mergeValue(node, arg.children, setText)
  } else if (arg.childrenType == 'html') {
    mergeValue(node, arg.children, setHtml)
  } else {
    const children = arg.children
    const tp = typeof children
    if (tp == 'function') {
      if ((children as any).type == 'text') {
        mergeValue(node, arg.children, setText)
      } else if ((children as any).type == 'html') {
        mergeValue(node, arg.children, setHtml)
      } else {
        renderPortal(node, children as any)
      }
    } else if (tp == 'number' || tp == 'string') {
      mergeValue(node, children, setText)
    }
  }
}

export interface MergeValue {
  (
    node: Node,
    value: any,
    setValue: (value: any, v: Node) => void
  ): void
  (
    node: Node,
    value: any,
    setValue: (value: any, v: Node, ext: string) => void,
    ext: string
  ): void
}


// const ATTR_PREFIX = "a_"
const DATA_PREFIX = "data_"
const ARIA_PREFIX = "aria_"
const S_PREFIX = "s_"
const CSS_PREFIX = "css_"
const CHILDREN_PREFIX = 'children'
/**
 * mve式更新
 * @param updateMAttr 
 * @returns 
 */
function createRenderFAttr(
  updateMAttr: UpdateProp,
) {
  return function (
    node: Node,
    arg: any,
    mergeValue: MergeValue,
    renderPortal: (n: Node, children: SetValue<Node>) => void,
    ignoreKeys: readonly string[]
  ) {
    for (const key in arg) {
      if (isEvent(key)) {
        addEvent(node, key, arg[key])
      } else if (key.startsWith(DATA_PREFIX)) {
        const dataAttr = key.slice(DATA_PREFIX.length)
        mergeValue(node, arg[key], updateDataSet, dataAttr)
      } else if (key.startsWith(ARIA_PREFIX)) {
        const ariaKey = key.slice(ARIA_PREFIX.length)
        mergeValue(node, arg[key], updateAttr, `aria-${ariaKey}`)
      } else if (key.startsWith(S_PREFIX)) {
        const styleKey = key.slice(S_PREFIX.length)
        mergeValue(node, arg[key], updateStyle, styleKey)
      } else if (key.startsWith(CSS_PREFIX)) {
        const cssVariable = key.slice(CSS_PREFIX.length)
        mergeValue(node, arg[key], updateCssVariable, `--${cssVariable}`)
      } else if (!key.startsWith(CHILDREN_PREFIX) && !ignoreKeys.includes(key)) {
        mergeValue(node, arg[key], updateMAttr, key)
      }
    }
    renderFGetChildAttr(node, arg, mergeValue, renderPortal)
  }
}

export const renderFDomAttr = createRenderFAttr(updateDom)
export const renderFSvgAttr = createRenderFAttr(updateSvg)


export const mergeValueDes: MergeValue = function (node, value, setValue) {
  const ext = arguments[3]
  if (isSyncFun(value)) {
    return value(setValue, node, ext)
  } else {
    setValue(value, node, ext)
  }
}
export const mergeValueSkipDes: MergeValue = function (node, value, setValue) {
  const ext = arguments[3]
  if (isSyncFun(value)) {
    return value(setValue, node, ext)
  }
}
function updateProp(
  node: any,
  key: string,
  value: any,
  oldDes: any,
  updateMAttr: UpdateProp,
  mergeValueDes: MergeValue,
  ignoreKeys: readonly string[]
) {
  oldDes[key]?.()
  if (key.startsWith(DATA_PREFIX)) {
    const dataAttr = key.slice(DATA_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateDataSet, dataAttr)
  } else if (key.startsWith(ARIA_PREFIX)) {
    const ariaKey = key.slice(ARIA_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateAttr, `aria-${ariaKey}`)
  } else if (key.startsWith(S_PREFIX)) {
    const styleKey = key.slice(S_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateStyle, styleKey)
  } else if (key.startsWith(CSS_PREFIX)) {
    const cssVariable = key.slice(CSS_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateCssVariable, `--${cssVariable}`)
  } else if (!key.startsWith(CHILDREN_PREFIX) && !ignoreKeys.includes(key)) {
    //普通属性key
    oldDes[key] = mergeValueDes(node, value, updateMAttr, key)
  }
}

/**
 * react式
 * 扁平化更新
 * @param updateMAttr 
 * @returns 
 */
function createMergeFNodeAttr(
  updateMAttr: UpdateProp
) {
  return function (
    node: Node,
    attrs: Props,
    oldAttrs: Props,
    oldDes: any,
    ignoreKeys: readonly string[],
    /**
     * 专为react的事件合并
     */
    skipEvent?: boolean
  ) {
    let mevent = mergeEvent
    let mergeValue = mergeValueDes
    if (skipEvent) {
      mevent = emptyFun
      mergeValue = mergeValueSkipDes
    }
    objectDiffDeleteKey(oldAttrs, attrs, function (key) {
      if (isEvent(key)) {
        mevent(node, key, oldAttrs[key])
      } else {
        updateProp(node, key, undefined, oldDes, updateMAttr, mergeValue, ignoreKeys)
      }
    })
    for (const key in attrs) {
      const value = attrs[key]
      const oldValue = oldAttrs[key]
      if (value != oldValue) {
        if (isEvent(key)) {
          mevent(node, key, oldAttrs[key], attrs[key])
        } else {
          updateProp(node, key, value, oldDes, updateMAttr, mergeValue, ignoreKeys)
        }
      }
    }
    return oldDes
  }
}
type SyncOrFun<T> = T | SyncFun<T>

/**
 * react模式所用的ChildType
 */
export type FMergeChildAttr<T> = {
  childrenType: "text";
  children: SyncOrFun<number | string>;
} | {
  childrenType: "html";
  children: SyncOrFun<number | string>;
} | {
  childrenType?: never;
  children?: SetValue<T>;
};

export const mergeFDomAttr = createMergeFNodeAttr(updateSvg)
export const mergeFSvgAttr = createMergeFNodeAttr(updateDom)