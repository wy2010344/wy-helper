import { emptyObject, objectDiffDeleteKey } from "wy-helper"
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


export function updateStyle(
  node: Node & {
    style: any
  },
  style: CSSProperties,
  oldStyle: CSSProperties
) {
  objectDiffDeleteKey(oldStyle as any, style as any, function (key) {
    node.style[key] = ''
  })
  for (const key in style) {
    const value = style[key as keyof CSSProperties]
    const oldValue = oldStyle[key as keyof CSSProperties]
    if (value != oldValue) {
      node.style[key] = value
    }
  }
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
  oldProps: Props
) {
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  objectDiffDeleteKey(oldProps, props, function (key: string) {
    if (isEvent(key)) {
      mergeEvent(node, key, oldProps[key])
    } else if (isProperty(key)) {
      updateProp(node, key, undefined)
    }
  })

  for (const key in props) {
    const value = props[key]
    const oldValue = oldProps[key]
    if (value != oldValue) {
      if (key == 'style') {
        const n = node as unknown as Node & { style: any }
        if (oldValue && typeof oldValue == 'object') {
          if (value && typeof value == 'object') {
            updateStyle(n, value, oldValue)
          } else {
            //旧是object,新是string
            n.style = value
          }
        } else {
          if (value && typeof value == 'object') {
            //旧是string,新是object
            n.style = undefined
            updateStyle(n, value, emptyObject)
          } else {
            //旧是string,新是string
            n.style = value
          }
        }
      } else if (isEvent(key)) {
        mergeEvent(node, key, oldValue, value)
      } else if (isProperty(key)) {
        updateProp(node, key, value)
      }
    }
  }
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