import { emptyObject, GetValue, objectDiffDeleteKey, run, SetValue, SyncFun } from "wy-helper"
import { DomElementType, SvgElementType } from "./html"
import { CSSProperties } from "./util"
export type Props = { [key: string]: any }


function mergeEvent(node: Node, key: string, oldValue: any, newValue?: any) {
  let eventType = key.toLowerCase().substring(2)
  let capture = false
  if (eventType.endsWith(Capture)) {
    eventType = eventType.slice(0, eventType.length - Capture.length)
    capture = true
  }
  if (newValue) {
    if (oldValue) {
      node.removeEventListener(eventType, oldValue, capture)
    }
    node.addEventListener(eventType, newValue, capture)
  } else {
    node.removeEventListener(eventType, oldValue, capture)
  }
}


function runAndDelete(map: any, key: string) {
  map[key]()
  delete map[key]
}
export interface UpdateFun<T> {
  (set: SetValue<T>): void;
  <A>(set: (t: T, a: A) => void, a: A): void;
  <A, B>(set: (t: T, a: A, b: B) => void, a: A, b: B): void;
  <A, B, C>(set: (t: T, a: A, b: B, c: C) => void, a: A, b: B, c: C): void;
}

export type WithCenterMap<T extends {}> = {
  [key in keyof T]: (T[key] | SyncFun<T[key]> | UpdateFun<T[key]>)
}

export function updateStyle(
  node: Node & {
    style: any
  },
  style: WithCenterMap<CSSProperties>,
  oldStyle: WithCenterMap<CSSProperties>,
  styleMap: Props
) {
  objectDiffDeleteKey(oldStyle as any, style as any, function (key) {
    const oldValue = oldStyle[key as any]
    if (isSyncFun(oldValue)) {
      runAndDelete(styleMap, key)
    }
    node.style[key] = ''
  })
  for (const key in style) {
    const value = style[key as keyof CSSProperties]
    const oldValue = oldStyle[key as keyof CSSProperties]
    if (value != oldValue) {
      if (isSyncFun(oldValue)) {
        runAndDelete(styleMap, key)
      }
      if (isSyncFun(value)) {
        if (key.startsWith('--')) {
          styleMap[key] = (value as any)(setStyleP, node, key)
        } else {
          styleMap[key] = (value as any)(setStyle, node, key)
        }
      } else {
        if (key.startsWith('--')) {
          if (typeof value == 'undefined') {
            node.style.removeProperty(key)
          } else {
            node.style.setProperty(key, value)
          }
        } else {
          node.style[key] = value
        }
      }
    }
  }
  return styleMap
}

function setStyleP(v: string | number | undefined, node: any, key: string) {
  if (typeof v == 'undefined') {
    node.style.removeProperty(key)
  } else {
    node.style.setProperty(key, v)
  }
}
function setStyle(v: string | number | undefined, node: any, key: string) {
  node.style[key] = v
}
function setStyleS(v: string | undefined, node: any) {
  //其实可能是string,可能是object
  node.style = v
}

/**
 * 更新节点
 * @param dom 
 * @param oldProps 
 * @param props 
 */
export function updateDom(
  node: Node,
  updateProp: (node: Node, key: string, value?: any) => void,
  props: Props,
  oldProps: Props,
  /**最后销毁绑定*/
  keepMap: Props
) {
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  objectDiffDeleteKey(oldProps, props, function (key: string) {
    if (isEvent(key)) {
      mergeEvent(node, key, oldProps[key])
    } else if (isProperty(key)) {
      updateProp(node, key, undefined)
      const del = keepMap[key]
      if (del) {
        //如果存在,则销毁
        if (typeof del == 'function') {
          del()
        } else {
          Object.values(del).forEach(run as any)
        }
        delete keepMap[key]
      }
    }
  })
  for (const key in props) {
    const value = props[key]
    const oldValue = oldProps[key]
    if (value != oldValue) {
      if (key == 'style') {
        const n = node as unknown as Node & { style: any }
        let oldStyleProps = oldValue
        let styleProps = keepMap[key]
        if (isSyncFun(oldValue)) {
          //旧是一个单值的valueCenter
          styleProps()
          delete keepMap[key]
          oldStyleProps = emptyObject
          styleProps = {}
        }
        if (value && typeof value == 'object') {
          //新为object
          keepMap.style = updateStyle(n, value, oldStyleProps || emptyObject, styleProps || {})
        } else if (isSyncFun(value)) {
          //新的是一个单值的valueCenter
          keepMap.style = value(setStyleS, n)
        } else {
          //新是string
          n.style = value
        }
      } else if (isEvent(key)) {
        mergeEvent(node, key, oldValue, value)
      } else if (isProperty(key)) {
        if (isSyncFun(oldValue)) {
          //旧属性删除
          runAndDelete(keepMap, key)
        }
        if (isSyncFun(value)) {
          keepMap[key] = value(setProp, node, key, updateProp)
        } else {
          updateProp(node, key, value)
        }
      }
    }
  }
  return keepMap
}

function setProp(v: string, node: any, key: string, updateProp: any) {
  updateProp(node, key, v)
}

function isSyncFun(n: any): n is SyncFun<any> {//是
  return typeof n == 'function'
}
const Capture = "capture"

/**
 * 是否是事件
 * @param key 
 * @returns 
 */
function isEvent(key: string) {
  return key.startsWith("on")
}
/**
 * 是否是属性，非child且非事件
 * @param key 
 * @returns 
 */
function isProperty(key: string) {
  if (key == 'children' || key == 'ref' || key == 'key') {
    //兼容考虑tsx里的情形
    return false
  }
  return true
}

export function isSVG(name: string) {
  return svgTagNames.includes(name as any)
}
export const svgTagNames: SvgElementType[] = [
  "svg",
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view",
  "title"
]

export const domTagNames: DomElementType[] = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noindex",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "slot",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "template",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "webview"
]