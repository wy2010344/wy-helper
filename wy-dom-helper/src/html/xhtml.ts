import { MergeValue, mergeValueDes, mergeValueSkipDes } from "./fhtml"
import { BDomAttribute, BSvgAttribute, DomElementType, React, SvgElementType } from "./html"
import { DataAttr, DomType, isProperty, isSyncFun, Props } from "./updateDom"
import { PureCSSProperties } from "../util"

import { addEvent, FDomAttributeC, FSvgAttributeC, isEvent, mergeEvent, setClassName, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, updateStyle, updateSvg } from "./fx";
import { emptyFun, objectDiffDeleteKey } from "wy-helper";


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



const DATA_PREFIX = "data-"
const ARIA_PREFIX = "aria-"
const ATTR_PREFIX = "a-"
const S_PREFIX = "s-"
const CSS_PREFIX = "css-"


function updateProp(
  node: any,
  key: string,
  value: any,
  oldDes: any,
  updateMAttr: (value: any, node: any, key: string) => void,
  mergeValueDes: MergeValue
) {
  oldDes[key]?.()
  oldDes[key] = undefined
  if (key == 'className') {
    oldDes[key] = mergeValueDes(node, value, setClassName)
  } else if (key.startsWith(ATTR_PREFIX)) {
    const attrKey = key.slice(ATTR_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateMAttr, attrKey)
  } else if (key.startsWith(DATA_PREFIX)) {
    const dataAttr = key.slice(DATA_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateDataSet, dataAttr)
  } else if (key.startsWith(ARIA_PREFIX)) {
    oldDes[key] = mergeValueDes(node, value, updateAttr, key)
  } else if (key.startsWith(S_PREFIX)) {
    const styleKey = key.slice(S_PREFIX.length)
    oldDes[key] = mergeValueDes(node, value, updateStyle, styleKey)
  } else if (key.startsWith(CSS_PREFIX)) {
    const cssVariable = key.slice(CSS_PREFIX.length)
    const cssVariableKey = `--${cssVariable}`
    oldDes[key] = mergeValueDes(node, value, updateCssVariable, cssVariableKey)
  }
}


export function mergeXNodeAttr(
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