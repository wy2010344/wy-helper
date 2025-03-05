import { getAttributeAlias } from "../getAttributeAlias"
import { BDomAttribute, BSvgAttribute, DomElementType, SvgElementType } from "./html"

// export type FDomAttributeC<T extends DomElementType> = Omit<BDomAttribute<T>, 'className'>
// export type FSvgAttributeC<T extends SvgElementType> = Omit<BSvgAttribute<T>, 'className'>

export function setClassName(value: string, node: any) {
  node.className = value
}

export function setText(value: string, node: any) {
  node.textContent = value
}

export function setHtml(value: string, node: any) {
  node.innerHTML = value
}
/**
 * 无className等,其它attr属性的更新
 * @param value 
 * @param node 
 * @param key 
 */
export function updateDom(value: any, node: any, key: string,) {
  if (key == 'href') {
    node[key] = value || ''
  } else {
    node[key] = value
  }
}

/**
 * 无className等,其它attr属性的更新
 * @param value 
 * @param node 
 * @param key 
 */
export function updateSvg(value: any, node: any, key: string) {
  if (key == 'className') {
    key = 'class'
  } else {
    key = getAttributeAlias(key)
  }
  if (value) {
    node.setAttribute(key, value)
  } else {
    node.removeAttribute(key)
  }
}

export function updateDataSet(value: any = '', node: any, key: any) {
  node.dataset[key] = value
}
export function updateAttr(value: any = '', node: any, key: string) {
  if (value) {
    node.setAttribute(key, value)
  } else {
    node.removeAttribute(key)
  }
}

export function updateStyle(value: any = '', node: any, key: string) {
  node.style[key] = value
}

export function updateCssVariable(value: any = '', node: any, key: string) {
  if (typeof value == 'undefined') {
    node.style.removeProperty(key)
  } else {
    node.style.setProperty(key, value)
  }
}

export function isEvent(key: string) {
  return key.startsWith(ON_PREFIX)
}
const ON_PREFIX = "on"
const CAPTURE_SUFFIX = "Capture"
export function mergeEvent(
  node: any,
  key: string,
  oldValue: any,
  newValue?: any
) {


  let eventType = key.slice(ON_PREFIX.length)
  let capture = false
  if (eventType.endsWith(CAPTURE_SUFFIX)) {
    capture = true
    eventType = eventType.slice(0, eventType.length - CAPTURE_SUFFIX.length)
  }
  //在dom里面只能使用小写字母,含有大写字母不被识别
  eventType = eventType.toLowerCase()
  if (oldValue) {
    node.removeEventListener(eventType, oldValue, capture)
  }
  if (newValue) {
    node.addEventListener(eventType, newValue, capture)
  }
}


export function addEvent(node: any, key: string, value: any) {
  mergeEvent(node, key, undefined, value)
}


export type UpdateProp = (value: any, node: any, key: string) => void