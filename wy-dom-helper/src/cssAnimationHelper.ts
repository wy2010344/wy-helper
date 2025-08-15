import { addEffect, EmptyFun, ReadSet, SetValue, StoreRef } from "wy-helper"
import { CSSProperties, getCommonParentNode, requestBatchAnimationFrame, splitClassNames } from "./util"

function forceFlow(div: Element | null | undefined) {
  //强制回流
  if (div) {
    const scrollTop = div.scrollTop
    div.scrollTop = scrollTop
    return scrollTop
  }
}

export type ClsWithStyle = {
  className?: string
  style?: CSSProperties
}
export type CNSWithStyle = {
  className?: Set<string>
  style?: CSSProperties
}

export function toCNSWithStyle<M extends ClsWithStyle>(c: M): CNSInfer<M> {
  if (c.className) {
    return {
      ...c,
      className: splitClassNames(c.className)
    }
  }
  return c as CNSInfer<M>
}

function clearStyle(div: Element & ElementCSSInlineStyle, m: CNSWithStyle) {
  if (m.className) {
    m.className.forEach(function (fc) {
      div.classList.remove(fc)
    })
  }
  if (m.style) {
    for (let key in m.style) {
      (div.style as any)[key] = ''
    }
  }
}
export function mergeStyle(div: Element & ElementCSSInlineStyle, m: CNSWithStyle) {
  if (m.className) {
    m.className.forEach(function (fc) {
      div.classList.add(fc)
    })
  }
  if (m.style) {
    for (let key in m.style) {
      (div.style as any)[key] = m.style[key as keyof CSSProperties]
    }
  }
}
export function forceFlowStyle<
  T extends ElementCSSInlineStyle & Element,
  M extends CNSWithStyle
>(div: T, style: M) {
  clearStyle(div, style)
  requesetBatchAnimationForceFlow(new Set([div]), function () {
    mergeStyle(div, style)
  })
  return style
}

/**
 * 与className合并成一个
 * @param div 
 * @param initStyle 
 * @param showStyle 
 * @param replaceFromStyle 
 * @returns 
 */
export function forceFlowInitStyle<
  T extends ElementCSSInlineStyle & Element,
  M extends CNSWithStyle
>(
  div: T,
  from: M,
  show: M,
  /**比如高度动画的退出,需要测量之前的真实高度,然后缩减到指定高度 */
  replaceFromStyle?: (div: T, style: M) => M
) {
  clearStyle(div, show)
  mergeStyle(div, from)
  let iFrom = from
  if (replaceFromStyle) {
    iFrom = replaceFromStyle(div, from)
    clearStyle(div, from)
    mergeStyle(div, iFrom)
  }
  requesetBatchAnimationForceFlow(new Set([div]), function () {
    clearStyle(div, iFrom)
    mergeStyle(div, show)
  })
  return show
}

export function createBatchForceFlow(finish: SetValue<EmptyFun>) {
  const tempList: {
    div: Set<Element>
    after: EmptyFun
  }[] = []
  function createTempList() {
    let superNode: Element | null = null
    for (let temp of tempList) {
      temp.div.forEach(div => {
        superNode = getCommonParentNode(superNode, div)
      })
    }
    if (superNode) {
      forceFlow(superNode as Element)
    }
    for (let temp of tempList) {
      temp.after()
    }
    tempList.length = 0
  }
  return function (div: Set<Element>, after: EmptyFun) {
    tempList.push({
      div,
      after
    })
    if (tempList.length == 1) {
      finish(createTempList)
    }
  }
}
export const requesetBatchAnimationForceFlow = createBatchForceFlow(requestBatchAnimationFrame)
export const signalEffectForceFlow = createBatchForceFlow(function (fun) {
  addEffect(fun, Infinity)
})


export type CNSInfer<M extends ClsWithStyle> = Omit<M, 'className'> & {
  className?: Set<string>
}


export type TriggerMConfig<T extends ElementCSSInlineStyle & Element, M extends ClsWithStyle> = {
  //初次禁止
  disabled?: boolean
  //非初次,强制进行一次动画
  force?: boolean
  from?: M
  target: M
  replaceFrom?(div: T, style: CNSInfer<M>): CNSInfer<M>
  callback?: EmptyFun
} & ({
  replaceTarget(div: T, style: CNSInfer<M>, from: CNSInfer<M>): CNSInfer<M>
  waitFinish(): Promise<any>
} | {
  replaceTarget?: never
  waitFinish?(): Promise<any>
})

export type GetRef<T extends ElementCSSInlineStyle & Element> = () => T


function effectInner<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle
>(
  ref: GetRef<T>,
  out: TriggerMConfig<T, M>,
  from: CNSInfer<M>,
  target: CNSInfer<M>
) {
  const div = ref()
  const replaceTarget = out.replaceTarget?.(div, target, from) || target
  forceFlowInitStyle(div, from, replaceTarget, out.replaceFrom)
  const wait = out.waitFinish?.()
  if (out.replaceTarget) {
    wait!.then(() => {
      clearStyle(div, replaceTarget)
      mergeStyle(div, target)
    })
  }
}

/**
 * 如果strict mode因为会执行两次,可能出现问题
 * 1是cache.set是依赖上一次变更的reducer
 * 2是对dom的操作.
 * 比如状态切换,依赖上一次的状态,应该怎么处理?只能在replaceFrom与replaceTarget里面处理吗?即通过replaceFrom有源的记忆,即reducer里面ClsWithStyle里面带着每个状态的的标签名.
 * @param ref 
 * @param init 
 * @param cache 
 * @returns 
 */
export function effectCssAinmationFirst<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle
>(
  ref: GetRef<T>,
  init: TriggerMConfig<T, M>,
  cache?: StoreRef<[M, CNSInfer<M>]>
) {
  const target = toCNSWithStyle(init.target)
  if (!init.disabled && init.from) {
    const from = toCNSWithStyle(init.from)
    effectInner(ref, init, from, target)
  }
  cache?.set([init.target, target])
  return init.callback
}

export function effectCssAnimationOther<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle
>(
  ref: GetRef<T>,
  out: TriggerMConfig<T, M>,
  cache: StoreRef<[M, CNSInfer<M>]>
) {
  //此时视图已经是当前的target,触发动画都需要回到过去
  const target = toCNSWithStyle(out.target)
  if (out.force || out.from || out.replaceFrom || out.replaceTarget) {
    const from = out.from ? toCNSWithStyle(out.from) : cache.get()[1]
    effectInner(ref, out, from, target)
  } else {
    out.waitFinish?.()
  }
  cache.set([out.target, target])
  return out.callback
}