

import { emptyFun, GetValue, objectDiffDeleteKey, SetValue, SyncFun, ValueOrGet } from "wy-helper";
import { PureCSSProperties } from "../util";
import { DomElementType, React, SvgElementType } from "./html";
import { addEvent, FDomAttributeC, FSvgAttributeC, isEvent, mergeEvent, setClassName, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, updateStyle, updateSvg } from "./fx";
import { DomType, isProperty, isSyncFun, Props } from "./updateDom";

type FDataAttr = {
  [key in `data_${string}`]?: string | number | boolean
}

type FDomAttributeCS<T extends DomElementType> = {
  [key in keyof FDomAttributeC<T> as (key extends string ? `a_${key}` : key)]: FDomAttributeC<T>[key]
}


type FSvgAttributeCS<T extends SvgElementType> = {
  [key in keyof FSvgAttributeC<T> as (key extends string ? `a_${key}` : key)]: FSvgAttributeC<T>[key]
}


type FCssVaribute = {
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

type FAriaAttribute = {
  [key in keyof React.AriaAttributes as FReplaceAria<key>]: React.AriaAttributes[key]
}



export type FDomAttribute<T extends DomElementType> = {
  className?: string
} & FDataAttr
  & FDomAttributeCS<T>
  & FAriaAttribute
  & FStyleProps
  & FCssVaribute

export type FSvgAttribute<T extends SvgElementType> = {
  className?: string
} & FDataAttr
  & FSvgAttributeCS<T>
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
  children?: SetValue<T>
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


const ATTR_PREFIX = "a_"
const DATA_PREFIX = "data_"
const ARIA_PREFIX = "aria_"
const S_PREFIX = "s_"
const CSS_PREFIX = "css_"
export function renderFNodeAttr(
  node: Node,
  arg: any,
  type: DomType,
  mergeValue: MergeValue,
  renderPortal: (n: Node, children: SetValue<Node>) => void
) {
  const updateMAttr = type == 'svg' ? updateSvg : updateDom
  for (const key in arg) {
    if (key == 'className') {
      mergeValue(node, arg[key], setClassName)
    } else if (isEvent(key)) {
      addEvent(node, key, arg[key])
    } else if (key.startsWith(ATTR_PREFIX)) {
      const attrKey = key.slice(ATTR_PREFIX.length)
      mergeValue(node, arg[key], updateMAttr, attrKey)
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
    }
  }

  if (arg.childrenType == 'text') {
    mergeValue(node, arg.children, setText)
  } else if (arg.childrenType == 'html') {
    mergeValue(node, arg.children, setHtml)
  } else if (arg.children) {
    renderPortal(node, arg.children)
  }
}

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
  updateMAttr: (value: any, node: any, key: string) => void,
  mergeValueDes: MergeValue
) {
  oldDes[key]?.()
  if (key == 'className') {
    oldDes[key] = mergeValueDes(node, value, setClassName)
  } else if (key.startsWith(ATTR_PREFIX)) {
    const attrKey = key.slice(ATTR_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateMAttr, attrKey)
  } else if (key.startsWith(DATA_PREFIX)) {
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
  }
}

export function mergeFNodeAttr(
  node: Node,
  attrs: Props,
  oldAttrs: Props,
  oldDes: any,
  type: DomType,
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
  const updateMAttr = type == 'svg' ? updateSvg : updateDom
  objectDiffDeleteKey(oldAttrs, attrs, function (key) {
    if (isEvent(key)) {
      mevent(node, key, oldAttrs[key])
    } else {
      updateProp(node, key, undefined, oldDes, updateMAttr, mergeValue)
    }
  })
  for (const key in attrs) {
    const value = attrs[key]
    const oldValue = oldAttrs[key]
    if (value != oldValue) {
      if (isEvent(key)) {
        mevent(node, key, oldAttrs[key], attrs[key])
      } else {
        updateProp(node, key, value, oldDes, updateMAttr, mergeValue)
      }
    }
  }
  return oldDes
}