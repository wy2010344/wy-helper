import { valueCenterOf } from "wy-helper"
import { createLink, createScript } from "./util"

export const prismStyle = [
  '', "coy", "dark", "funky", "okaidia", "solarizedlight", "tomorrow", "twilight",
  //"a11y-dark","atom-dark","base16-ateliersulphurpool.light","cb","darcula","dracula","duotone-dark","duotone-earth","duotone-forest","duotone-light","duotone-sea","duotone-space","ghcolors","hopscotch","material-dark","material-light","material-oceanic","pojoaque","shades-of-purple","synthwave84","vs","xonokai"
] as const
type PrismStyleType = typeof prismStyle[number]
let init = false
const prefix = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/'

export function initPrisma(arg?: {
  path?: string
  initStyle?: PrismStyleType
}) {
  if (init) {
    throw new Error("prism already init")
  }
  init = true
  const path = arg?.path || prefix
  const currentStyle = valueCenterOf(arg?.initStyle || '')
  currentStyle.subscribe(function (v) {
    link.href = getLink()
  })
  function getLink() {
    const v = currentStyle.get()
    const pv = v == '' ? '' : `-${v}`
    return `${path}themes/prism${pv}.css`
  }
  const link = createLink(getLink())
  createScript(`${path}components/prism-core.min.js`)
  createScript(`${path}plugins/autoloader/prism-autoloader.min.js`)


  return {
    currentStyle,
    styleList: prismStyle,
    highlightElement(el: Element) {
      (window as any).Prism?.highlightElement(el)
    }
  }
}

