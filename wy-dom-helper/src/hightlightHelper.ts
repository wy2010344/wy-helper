import { valueCenterOf } from "wy-helper"
import { createLink, createScript } from "./util"



const hightlightStyle = [
  "dracula",
  "github",
  "solarized-dark",
  "solarized-light",
  "railscasts",
  "monokai-sublime",
  "mono-blue",
  "tomorrow",
  "color-brewer",
  "zenburn",
  "agate",
  "androidstudio",
  "atom-one-light",
  "rainbow",
  "vs",
  "atom-one-dark",
] as const

type HightlightStyleType = typeof hightlightStyle[number]
let init = false
const pathPrefix = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/"
export function initHightlight(arg?: {
  path?: string
  initStyle?: HightlightStyleType
}) {
  if (init) {
    throw new Error("hightlight already init")
  }
  init = true
  const path = arg?.path || pathPrefix
  const currentStyle = valueCenterOf(arg?.initStyle || 'dracula')
  currentStyle.subscribe(function (v) {
    link.href = getLink()
  })
  function getLink() {
    const v = currentStyle.get()
    return `${path}styles/${v}.min.css`
  }
  const link = createLink(getLink())
  createScript(`${path}highlight.min.js`)
  return {
    currentStyle,
    styleList: hightlightStyle,
    highlightElement(el: Element) {
      (window as any).hljs?.highlightBlock(el)
    }
  }
}