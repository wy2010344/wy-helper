import { MergeValue, mergeValueDes, mergeValueSkipDes } from "./fhtml"
import { BDomAttribute, BSvgAttribute, DomElementType, React, SvgElementType } from "./html"
import { DataAttr, Props } from "./updateDom"
import { PureCSSProperties } from "../util"

import { isEvent, mergeEvent, setClassName, updateAttr, updateCssVariable, updateDataSet, updateDom, UpdateProp, updateStyle, updateSvg } from "./fx";
import { emptyFun, objectDiffDeleteKey } from "wy-helper";


// type XDomAttributeCS<T extends DomElementType> = {
//   [key in keyof FDomAttributeC<T> as (key extends string ? `a-${key}` : key)]: FDomAttributeC<T>[key]
// }


// type XSvgAttributeCS<T extends SvgElementType> = {
//   [key in keyof FSvgAttributeC<T> as (key extends string ? `a-${key}` : key)]: FSvgAttributeC<T>[key]
// }
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
  & BDomAttribute<T>
  & XStyleProps
  & XCssVaribute

export type XSvgAttribute<T extends SvgElementType> = {
  className?: string
} & DataAttr
  & React.AriaAttributes
  & BSvgAttribute<T>
  & XStyleProps
  & XCssVaribute



const DATA_PREFIX = "data-"
const ARIA_PREFIX = "aria-"
// const ATTR_PREFIX = "a-"
const S_PREFIX = "s-"
const CSS_PREFIX = "css-"
const CHILDREN_PREFIX = 'children'

function updateProp(
  node: any,
  key: string,
  value: any,
  oldDes: any,
  updateMAttr: (value: any, node: any, key: string) => void,
  mergeValueDes: MergeValue,
  ingoreKeys: readonly string[]
) {
  oldDes[key]?.()
  oldDes[key] = undefined
  if (key.startsWith(DATA_PREFIX)) {
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
  } else if (!key.startsWith(CHILDREN_PREFIX) && !ingoreKeys.includes(key)) {

    oldDes[key] = mergeValueDes(node, value, updateMAttr, key)
  }
}

/**
 * 在XML语境中,所有style变成破折线扁平
 * @param updateMAttr 
 * @returns 
 */
function createMergeXNodeAttr(
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


export const mergeXSvgAttr = createMergeXNodeAttr(updateDom)
export const mergeXDomAttr = createMergeXNodeAttr(updateSvg)
