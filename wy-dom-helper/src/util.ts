

export function createScript(
  src: string
) {
  const script = document.createElement("script")
  script.src = src
  document.head.appendChild(script)
  return script
}

export function createLink(href: string) {
  const link = document.createElement("link")
  link.href = href
  link.rel = "stylesheet"
  document.head.appendChild(link)
  return link
}


/**如果是通过点击label过来的,最好附加在label内,否则会滚动到输入框 */
function createFileInput(id?: string) {
  const input = document.createElement("input");
  input.style.position = "absolute";
  input.style.left = "-1px";
  input.style.top = "-1px";
  input.style.width = "0px";
  input.style.height = "0px";
  input.setAttribute("type", "file");
  if (id) {
    input.id = id;
    const label = document.querySelector(`label[for=${id}]`);
    label?.appendChild(input);
  } else {
    document.body.appendChild(input);
  }
  return input;
}
export function chooseFileThen({
  accept,
  onChange,
}: {
  accept?: string;
  onChange(file: File): Promise<any>;
}) {
  const input = createFileInput();
  if (accept) {
    input.setAttribute("accept", accept);
  }
  input.addEventListener("change", async function (e) {
    const file = input.files?.[0];
    if (file) {
      await onChange(file);
    }
    input.remove();
  });
  input.click();
}

export function cns(...vs: (string | null | undefined | boolean)[]) {
  return vs.filter((v) => v).join(" ");
}



export function delayAnimationFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}

export function stringifyStyle(style: CSSProperties) {
  const s = Object.entries(style).map(function (v) {
    return `${underlineToCamel(v[0])}:${v[1]};`
  }).join("")
  return s
}

export function underlineToCamel(str: string) {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}

export function getTrim(v: string) {
  return v.trim()
}
/**
 * 先就简单这么分割吧,如果文字还\n,\t,会以之分割并中断
 * @param names 
 * @returns 
 */
export function splitClassNames(names: string) {
  return new Set(names.split(' ').map(getTrim).filter(quote))
}

import * as CSS from 'csstype';
import { EmptyFun, quote, run } from 'wy-helper'
export interface CSSProperties extends CSS.Properties<string | number> {
  /**
   * The index signature was removed to enable closed typing for style
   * using CSSType. You're able to use type assertion or module augmentation
   * to add properties or an index signature of your own.
   *
   * For examples and more information, visit:
   * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
   */
}



export function observerIntersection(
  callback: IntersectionObserverCallback,
  flag: Element,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(callback, options)
  observer.observe(flag)
  return function () {
    observer.unobserve(flag)
    observer.disconnect()
  }
}


export function forceFlow(div: Element | null | undefined) {
  //强制回流
  if (div) {
    const scrollTop = div.scrollTop
    div.scrollTop = scrollTop
    return scrollTop
  }
}

/**
 * 强制进行动画
 * @param div 
 * @param classNames 
 */
export function forceFlowClassNames(div: Element, classNames: string) {
  const list = splitClassNames(classNames)
  list.forEach(row => div.classList.remove(row))
  forceFlow(div)
  list.forEach(row => div.classList.add(row))
  return classNames
}
export function forceFlowInitClassNames(div: Element, initCls: string, showCls: string) {
  const inits = splitClassNames(initCls)
  const shows = splitClassNames(showCls)
  shows.forEach(function (fc) {
    div.classList.remove(fc)
  })
  inits.forEach(function (tc) {
    div.classList.add(tc)
  })
  forceFlow(div)
  inits.forEach(function (tc) {
    div.classList.remove(tc)
  })
  shows.forEach(function (fc) {
    div.classList.add(fc)
  })
  return showCls
}

export function requestBatchAnimationFrame(fun: EmptyFun) {
  cacheList.push(fun)
  if (cacheList.length == 1) {
    requestAnimationFrame(function () {
      cacheList.forEach(run)
      cacheList.length = 0
    })
  }
}
const cacheList: EmptyFun[] = []