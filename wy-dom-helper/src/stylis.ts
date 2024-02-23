import { compile, serialize, stringify, middleware, prefixer } from 'stylis'
import { EmptyFun, run, ValueCenter } from 'wy-helper'

let uid = 0
function newClassName() {
  return 'stylis-' + uid++
}
function toCssFragment(className: string, css: string) {
  return serialize(compile(`.${className}{${css}}`), middleware([prefixer, stringify]))
}

export function createBodyStyleTag() {
  const style = document.createElement("style")
  const head = document.head
  const className = newClassName()
  style.id = className
  head.appendChild(style)
  return style
}


function genCircleMap<T extends CssNest>(
  map: T,
  prefix = '',
  split = '',
  contents: string[]
): T {
  if (typeof map == 'string') {
    //不管split
    contents.push(toCssFragment(prefix, map))
    return prefix as any
  } else if (Array.isArray(map)) {
    return map.map(function (value, i) {
      return genCircleMap(value, `${prefix}${split}${i}`, split, contents)
    }) as any
  } else {
    const classMap: any = {}
    Object.entries(map).forEach(function ([key, value]) {
      const out = genCircleMap(value, `${prefix}${split}${key}`, split, contents)
      classMap[key] = out
    })
    return classMap
  }
}

export function genCssMap<T extends CssNest>(
  map: T,
  prefix = '',
  split = ''
): {
  css: string
  classMap: T
} {
  const contents: string[] = []
  const classMap = genCircleMap(map, prefix, split, contents)
  return {
    css: contents.join('\n'),
    classMap,
  }
}

export type CSSParamType = string | number | null | undefined | boolean
export function genCSS(ts: TemplateStringsArray, vs: CSSParamType[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    const v = vs[i]
    xs.push(typeof v == 'number' ? v : v || '')
  }
  xs.push(ts[vs.length])
  return xs.join('')
}
interface RecordCssNest {
  [key: string]: string | RecordCssNest | ArrayCssNest
}
type ArrayCssNest = (string | RecordCssNest)[]
export type CssNest = string | RecordCssNest | ArrayCssNest

/**
 * 这里是全局的,所以应该在回调里使用
 * @param map 
 * @returns 
 */
export function cssMap<T extends CssNest>(map: T, split?: string) {
  const styled = createBodyStyleTag()
  const { css, classMap } = genCssMap(map, styled.id, split)
  styled.textContent = css
  return classMap
}
/**
 * 单个可以直接用StylisCreater
 * 这里要延迟到下一次触发
 * @param ts 
 * @param vs 
 * @returns 
 */
export function css(ts: TemplateStringsArray, ...vs: CSSParamType[]) {
  const style = createBodyStyleTag()
  style.textContent = toCssFragment(style.id, genCSS(ts, vs))
  return style.id
}

/**
 * 全局状态
 * @param map 
 * @param split 
 */
export function observeCssmap<T extends CssNest, VS extends readonly any[]>(
  values: {
    [key in keyof VS]: ValueCenter<VS[key]>
  },
  getMap: (vs: VS) => T,
  split?: string
) {
  const styled = createBodyStyleTag()
  const vs: any[] = []
  const destroyList: EmptyFun[] = []
  for (const value of values) {
    vs.push(value.get())
    destroyList.push(value.subscribe(function () {
      const { css } = genCssMap(getMap(values.map(value => value.get()) as any), styled.id, split)
      styled.textContent = css
    }))
  }
  const { css, classMap } = genCssMap(getMap(vs as any), styled.id, split)
  styled.textContent = css
  return [classMap, function () {
    destroyList.forEach(run)
  }] as const
}