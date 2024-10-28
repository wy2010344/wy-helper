import { emptyObject, objectDiffDeleteKey, ReadValueCenter, run, syncMergeCenter } from "wy-helper"
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

export type WithCenterMap<T extends {}> = {
  [key in keyof T]: (T[key] | ReadValueCenter<T[key]>)
}

export function updateStyle(
  node: Node & {
    style: any
  },
  style: WithCenterMap<CSSProperties>,
  oldStyle: WithCenterMap<CSSProperties>,
  styleMap: Props
) {
  //先克隆,在effect操作,也许并不需要克隆
  styleMap = { ...styleMap }
  objectDiffDeleteKey(oldStyle as any, style as any, function (key) {
    const oldValue = oldStyle[key as any]
    if (isValueCenter(oldValue)) {
      runAndDelete(styleMap, key)
    }
    node.style[key] = ''
  })
  for (const key in style) {
    const value = style[key as keyof CSSProperties]
    const oldValue = oldStyle[key as keyof CSSProperties]
    if (value != oldValue) {
      if (isValueCenter(oldValue)) {
        runAndDelete(styleMap, key)
      }
      if (isValueCenter(value)) {
        if (key.startsWith('--')) {
          styleMap[key] = syncMergeCenter(value, v => {
            if (typeof value == 'undefined') {
              node.style.removeProperty(key)
            } else {
              node.style.setProperty(key, v)
            }
          })
        } else {
          styleMap[key] = syncMergeCenter(value, v => {
            node.style[key] = v
          })
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
  oldMap: Props
) {
  const newMap: any = {
    ...oldMap
  }
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  objectDiffDeleteKey(oldProps, props, function (key: string) {
    if (isEvent(key)) {
      mergeEvent(node, key, oldProps[key])
    } else if (isProperty(key)) {
      updateProp(node, key, undefined)
      const del = newMap[key]
      if (del) {
        //如果存在,则销毁
        if (typeof del == 'function') {
          del()
        } else {
          Object.values(del).forEach(run as any)
        }
        delete newMap[key]
      }
    }
  })
  for (const key in props) {
    const value = props[key]
    const oldValue = oldProps[key]
    if (value != oldValue) {
      if (key == 'style') {
        const n = node as unknown as Node & { style: any }
        if (oldValue && typeof oldValue == 'object') {
          //存在旧
          let oldStyleProps = oldValue
          let styleProps = newMap[key]
          if (isValueCenter(oldValue)) {
            //旧是一个单值的valueCenter
            styleProps()
            delete newMap[key]
            oldStyleProps = emptyObject
            styleProps = emptyObject
          }
          if (value && typeof value == 'object') {
            if (isValueCenter(value)) {
              //新的是一个单值的valueCenter
              newMap.style = syncMergeCenter(value, v => {
                //其实可能是string,可能是object
                n.style = v
              })
            } else {
              //新为object
              newMap.style = updateStyle(n, value, oldStyleProps, styleProps)
            }
          } else {
            //新是string
            n.style = value
          }
        } else {
          //不存在旧
          if (value && typeof value == 'object') {
            if (isValueCenter(value)) {
              //新的是一个单值的valueCenter
              newMap.style = syncMergeCenter(value, v => {
                //其实可能是string,可能是object
                n.style = v
              })
            } else {
              //新是object
              n.style = undefined
              newMap.style = updateStyle(n, value, emptyObject, emptyObject)
            }
          } else {
            //新是string
            n.style = value
          }
        }
      } else if (isEvent(key)) {
        mergeEvent(node, key, oldValue, value)
      } else if (isProperty(key)) {
        if (isValueCenter(oldValue)) {
          //旧属性删除
          newMap[key]()
          delete newMap[key]
        }
        if (isValueCenter(value)) {
          newMap[key] = syncMergeCenter(value, v => {
            updateProp(node, key, v)
          })
        } else {
          updateProp(node, key, value)
        }
      }
    }
  }
  return newMap
}


function isValueCenter(n: any): n is ReadValueCenter<any> {//是
  return ('get' in n && 'subscribe' in n)
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