

import { GetValue, SetValue } from "wy-helper";
import { PureCSSProperties } from "./util";
import { DomElementType, React, SvgElementType } from "./html";
import { addEvent, FDomAttributeC, FSvgAttributeC, isEvent, setClassName, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, updateStyle, updateSvg } from "./fx";

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

export type FChildAttr<T> = {
  childrenType: "text"
  children: string | GetValue<string>
} | {
  childrenType: "html"
  children: string | GetValue<string>
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
  type: "svg" | "dom",
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