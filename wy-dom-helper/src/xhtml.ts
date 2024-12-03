import { MergeValue } from "./fhtml"
import { BDomAttribute, BSvgAttribute, DomElementType, React, SvgElementType } from "./html"
import { DataAttr, Props } from "./updateDom"
import { PureCSSProperties } from "./util"

import { addEvent, FDomAttributeC, FSvgAttributeC, isEvent, setClassName, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, updateStyle, updateSvg } from "./fx";


type XDomAttributeCS<T extends DomElementType> = {
  [key in keyof FDomAttributeC<T> as (key extends string ? `a-${key}` : key)]: FDomAttributeC<T>[key]
}


type XSvgAttributeCS<T extends SvgElementType> = {
  [key in keyof FSvgAttributeC<T> as (key extends string ? `a-${key}` : key)]: FSvgAttributeC<T>[key]
}
type XStyleProps = {
  [key in keyof PureCSSProperties as `s-${key}`]: PureCSSProperties[key]
}

type XCssVaribute = {
  [key in `css-${string}`]?: string | number | boolean
}
export type XDomAttribute<T extends DomElementType> = {
  className?: string
} & DataAttr
  & React.AriaAttributes
  & XDomAttributeCS<T>
  & XStyleProps
  & XCssVaribute

export type XSvgAttribute<T extends SvgElementType> = {
  className?: string
} & DataAttr
  & React.AriaAttributes
  & XSvgAttributeCS<T>
  & XStyleProps
  & XCssVaribute



const ATTR_PREFIX = "a-"
const DATA_PREFIX = "data-"
const ARIA_PREFIX = "aria-"
const S_PREFIX = "s-"
const CSS_PREFIX = "css-"
export function renderXNodeAttr(
  node: Node,
  arg: any,
  type: "svg" | "dom",
  mergeValue: MergeValue,
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
      mergeValue(node, arg[key], updateDataSet, key)
    } else if (key.startsWith(ARIA_PREFIX)) {
      mergeValue(node, arg[key], updateAttr, key)
    } else if (key.startsWith(S_PREFIX)) {
      const styleKey = key.slice(S_PREFIX.length)
      mergeValue(node, arg[key], updateStyle, styleKey)
    } else if (key.startsWith(CSS_PREFIX)) {
      const cssVariable = key.slice(CSS_PREFIX.length)
      mergeValue(node, arg[key], updateCssVariable, `--${cssVariable}`)
    }
  }
}


export function mergeXNodeAttr(
  node: Node,
  attrs: Props,
  oldAttrs: Props,
  oldDes: any
) {

}