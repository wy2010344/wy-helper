/**
 * 主要是将style属性提到最顶层
 * 属性里常用的属性,在最顶层
 * 主要是dom的属性
 * 为dom使用,不为svg使用
 * 
 */

import { emptyObject, FalseType, objectDiffDeleteKey, SetValue } from "wy-helper"
import { addEvent, isEvent, setHtml, setText, updateAttr, updateCssVariable, updateDataSet, updateDom, UpdateProp, updateStyle, updateSvg } from "./fx"
import { Props } from "./updateDom"
import { FAriaAttribute, FCssVaribute, FDataAttr, MergeValue } from "./fhtml"
import { BDomAttribute, DomElementType } from "./html"
import { PureCSSProperties } from "../util"


const ignoreDomAttrKeys = [
  'className',
  'id',
  //链接
  'href',
  'target',
  //表单元素
  'type',
  'disabled',
  'method',
  'name',
  'accept',
  'autoFocus',
  'min',
  'max',
  'label',
  'value',
  'placeholder',

  //链接
  'src',
  'alt',

  'unselectable',
  'spellcheck',
  'tabIndex',
  'title',
  'role',

  'rel',
  'required',
  'checked',

  'lang',

  'colspan',
  'rowspan'
] as const




// const ATTR_PREFIX = "a_"
const DATA_PREFIX = "data_"
const ARIA_PREFIX = "aria_"
const S_PREFIX = "s_"
const CSS_PREFIX = "css_"
const CHILDREN_PREFIX = 'children'
function updateMInsideNodeAttr(
  node: Node,
  key: string,
  value: any,
  updateMAttr: UpdateProp
) {
  if (key.startsWith(DATA_PREFIX)) {
    //data-attr属性
    const dataAttr = key.slice(DATA_PREFIX.length)
    updateDataSet(value, node, dataAttr)
  } else if (key.startsWith(ARIA_PREFIX)) {
    //aria属性
    const ariaKey = key.slice(ARIA_PREFIX.length)
    updateAttr(value, node, `aria-${ariaKey}`)
  } else if (key.startsWith(S_PREFIX)) {
    //css属性
    const styleKey = key.slice(S_PREFIX.length)
    updateStyle(value, node, styleKey)
  } else if (key.startsWith(CSS_PREFIX)) {
    //css变量属性
    const cssVariable = key.slice(CSS_PREFIX.length)
    updateCssVariable(value, node, `--${cssVariable}`)
  } else {
    //attr属性
    updateMAttr(value, node, key)
  }
}

const A_PREFIX = 'a_'
function updateGInsideNodeAttr(
  node: Node,
  key: string,
  value: any,
  updateMAttr: UpdateProp
) {
  if (key.startsWith(DATA_PREFIX)) {
    //data-attr属性
    const dataAttr = key.slice(DATA_PREFIX.length)
    updateDataSet(value, node, dataAttr)
  } else if (key.startsWith(ARIA_PREFIX)) {
    //aria属性
    const ariaKey = key.slice(ARIA_PREFIX.length)
    updateAttr(value, node, `aria-${ariaKey}`)
  } else if (key.startsWith(A_PREFIX)) {
    //attr属性
    const attrKey = key.slice(A_PREFIX.length)
    updateMAttr(value, node, attrKey)
  } else if (key.startsWith(CSS_PREFIX)) {
    //css变量属性
    const cssVariable = key.slice(CSS_PREFIX.length)
    updateCssVariable(value, node, `--${cssVariable}`)
  } else if (ignoreDomAttrKeys.includes(key as 'className')) {
    //attr属性
    updateMAttr(value, node, key)
  } else {
    //其余的作为style属性
    updateStyle(value, node, key)
  }
}


/***
 * 所有属性的diff更新,mergeValue只有一个
 */
function createRenderMAttr(
  updateMAttr: UpdateProp,
  updateInsideNodeAttr: typeof updateMInsideNodeAttr
) {
  return function (
    node: Node,
    arg: any = emptyObject,
    mergeValue: MergeValue,
    renderPortal: (n: Node, children: SetValue<Node>) => void
  ) {
    for (const key in arg) {
      if (isEvent(key)) {
        addEvent(node, key, arg[key])
      } else if (key == 'attrs') {
        const attrsNoObserver = arg.attrsNoObserver
        const initValue = arg[key]
        if (attrsNoObserver) {
          //普通模式
          const newAttrs = {} as Props
          initValue(newAttrs)
          for (const key in newAttrs) {
            //修改
            const value = newAttrs[key]
            updateInsideNodeAttr(node, key, value, updateMAttr)
          }
        } else {
          //观察模式
          let oldAttrs = emptyObject as any
          mergeValue(node, function () {
            const newAttrs = {}
            initValue(newAttrs)
            return newAttrs
          }, function (newAttrs: Props) {
            objectDiffDeleteKey(oldAttrs, newAttrs, (key) => {
              //删除
              updateInsideNodeAttr(node, key, undefined, updateMAttr)
            })
            for (const key in newAttrs) {
              //修改
              const value = newAttrs[key]
              const oldValue = oldAttrs[key]
              if (value != oldValue) {
                updateInsideNodeAttr(node, key, value, updateMAttr)
              }
            }
            oldAttrs = newAttrs
          })
        }
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
}



export const renderMSvgAttr = createRenderMAttr(updateDom, updateMInsideNodeAttr)
export const renderMDomAttr = createRenderMAttr(updateSvg, updateMInsideNodeAttr)

type IgnoreKeys = typeof ignoreDomAttrKeys[number]
type OmitBDomAttribute<T extends DomElementType> = Omit<BDomAttribute<T>, IgnoreKeys>
type MAttrProps<T extends DomElementType> = {
  [key in keyof OmitBDomAttribute<T> as (key extends string ? `a_${key}` : key)]: OmitBDomAttribute<T>[key]
}
type SafePick<T, K extends PropertyKey> = {
  [P in K]?: P extends keyof T ? T[P] : never;
}
export type GDomAttribute<T extends DomElementType> =
  MAttrProps<T>
  & SafePick<BDomAttribute<T>, IgnoreKeys>
  & FDataAttr
  & FAriaAttribute
  & PureCSSProperties
  & FCssVaribute
export const renderGDomAttr = createRenderMAttr(updateSvg, updateGInsideNodeAttr)