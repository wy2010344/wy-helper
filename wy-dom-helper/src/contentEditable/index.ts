import { GetValue, SetValue, StoreRef } from "wy-helper"
import { React } from "../html/html"
import { MbRange, browser, initRecord, mb } from "../mb"
export * from '../mb'
export * from './editFix'

export type EditRecord = {
  //选择区域是跟随的,但事实上也可能独立
  scrollTop: number
  scrollLeft: number
  range: MbRange
  value: string
}
export type ContentEditableModel = {
  currentIndex: number
  history: EditRecord[]
}
export function getCurrentEditRecord(v: ContentEditableModel) {
  return v.history[v.currentIndex]
}

export function initContentEditableModel(
  content: string
): ContentEditableModel {
  return {
    currentIndex: 0,
    history: [initRecord(content)],
  };
}


export function getCurrentRecord(editor: HTMLElement): EditRecord {
  const value = editor.textContent || ''
  const range = mb.DOM.getSelectionRange(editor)
  if (!range) {
    throw 'error-1'
  }
  return {
    scrollTop: editor.scrollTop,
    scrollLeft: editor.scrollLeft,
    value,
    range
  }
}

export function contentEnter(editor: HTMLElement) {
  return contentInput(editor, '\n', 1)
}
function sortNum(a: number, b: number) {
  return a - b
}
export function contentInput(editor: HTMLElement, text: string, addIdx: number): EditRecord {
  const { value, range, ...args } = getCurrentRecord(editor)
  const [min, max] = [range.start, range.end].sort(sortNum)
  const beforeText = value.slice(0, min)
  //如果没有后继,强行加一个换行,看原生也是这么处理的
  const afterText = value.slice(max, value.length) || '\n'
  let idx = beforeText.length + addIdx
  return {
    ...args,
    value: beforeText + text + afterText,
    range: {
      start: idx,
      end: idx,
      dir: range.dir
    }
  }
}


export function contentDelete(editor: HTMLElement): EditRecord | void {
  const { value, range, ...args } = getCurrentRecord(editor)
  const [min, max] = [range.start, range.end].sort(sortNum)
  const beforeText = value.slice(0, min)
  //如果没有后继,强行加一个换行,看原生也是这么处理的
  const afterText = value.slice(max, value.length)
  if (min != max) {
    //删除选中区域
    return {
      ...args,
      value: beforeText + afterText,
      range: {
        start: min,
        end: min
      }
    }
  } else {
    //向前退一步
    if (min != 0) {
      const idx = range.start - 1
      return {
        ...args,
        value: beforeText.slice(0, beforeText.length - 1) + afterText,
        range: {
          ...range,
          start: idx,
          end: idx
        }
      }
    }
  }
}
export function contentTab(
  editor: HTMLElement,
  shiftKey: boolean,
  tab = "\t",
): EditRecord | void {
  const { value, range, ...args } = getCurrentRecord(editor)
  //这里实时range,应该更新历史记录中的range,即如果之前是选中的tab,撤销时会恢复成选中状态.
  const [min, max] = [range.start, range.end].sort(sortNum)
  if (range.start != range.end) {
    //多行
    if (shiftKey) {
      const lines = value.split('\n')
      let beforeIdx = 0
      const newLines: string[] = []
      let canTab = false
      let removeLine = 0
      let removeFirst = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const nextIdx = beforeIdx + line.length + 1
        if (beforeIdx <= min && min < nextIdx) {
          canTab = true
          if (line.startsWith(tab) && beforeIdx + tab.length <= min) {
            removeFirst = tab.length
          }
        }
        if (canTab && line.startsWith(tab)) {
          removeLine++
          newLines.push(line.slice(tab.length, line.length))
        } else {
          newLines.push(line)
        }
        if (beforeIdx <= max && max < nextIdx) {
          canTab = false
        }
        beforeIdx = nextIdx
      }
      return {
        ...args,
        value: newLines.join('\n'),
        range: range.start > range.end ? {
          start: range.start - (removeLine * tab.length),
          end: range.end - removeFirst,
          dir: range.dir
        } : {
          start: range.start - removeFirst,
          end: range.end - (removeLine * tab.length),
          dir: range.dir
        }
      }
    } else {
      const lines = value.split('\n')
      let beforeIdx = 0
      const newLines: string[] = []
      let canTab = false
      let addLine = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const nextIdx = beforeIdx + line.length + 1
        if (beforeIdx <= min && min < nextIdx) {
          canTab = true
        }
        if (canTab) {
          addLine++
          newLines.push(tab + line)
        } else {
          newLines.push(line)
        }
        if (beforeIdx <= max && max < nextIdx) {
          canTab = false
        }
        beforeIdx = nextIdx
      }
      return {
        ...args,
        value: newLines.join('\n'),
        range: range.start > range.end ? {
          start: range.start + (addLine * tab.length),
          end: range.end + tab.length,
          dir: range.dir
        } : {
          start: range.start + tab.length,
          end: range.end + (addLine * tab.length),
          dir: range.dir
        }
      }
    }
  } else {
    const beforeText = value.slice(0, min)
    const afterText = value.slice(max, value.length)
    //单行
    if (shiftKey) {
      if (beforeText.endsWith(tab)) {
        const newIndex = beforeText.length - tab.length
        return {
          ...args,
          value: beforeText.slice(0, beforeText.length - tab.length) + afterText,
          range: {
            start: newIndex,
            end: newIndex
          }
        }
      }
    } else {
      const newIndex = beforeText.length + tab.length
      return {
        ...args,
        value: beforeText + tab + afterText,
        range: {
          start: newIndex,
          end: newIndex
        }
      }
    }
  }
}

export const contentEditableText = browser.type == "FF" ? true : "plaintext-only" as const


export function fixScroll(div: HTMLElement, current: EditRecord) {
  const selection = mb.DOM.setSelectionRange(div, { ...current.range })
  div.scrollTop = current.scrollTop
  div.scrollLeft = current.scrollLeft
  // 获取光标位置
  if (!selection.rangeCount) {
    return
  }
  const range = selection.getRangeAt(0);
  const rgag = range.endContainer == div ? div.lastElementChild : range
  if (rgag) {
    const rect = rgag.getBoundingClientRect()
    // 如果光标位置超出可视区域，调整滚动位置
    if (rect.bottom > div.clientHeight) {
      div.scrollTop += rect.bottom - div.clientHeight;
    } else if (rect.top < 0) {
      div.scrollTop += rect.top;
    }
    if (rect.right > div.clientWidth) {
      div.scrollLeft += rect.right - div.clientWidth;
    } else if (rect.left < 0) {
      div.scrollLeft += rect.left;
    }
  }
}


export function redo(model: ContentEditableModel) {
  const ndx = model.currentIndex + 1
  if (ndx < model.history.length) {
    return {
      ...model,
      currentIndex: ndx
    }
  }
  return model
}

export function undo(model: ContentEditableModel) {
  if (model.currentIndex) {
    return {
      ...model,
      currentIndex: model.currentIndex - 1
    }
  }
  return model
}

export function reset(record: EditRecord) {
  return {
    currentIndex: 0,
    history: [
      record
    ]
  }
}

/**
 * 减少历史数量,如果只是追加,也许不用那么频繁
 * @param model 
 * @param record 
 * @returns 
 */
export function appendRecord(model: ContentEditableModel, record: EditRecord, maxLength = 100): ContentEditableModel {
  const cdx = model.currentIndex
  const history = model.history.slice(0, cdx + 1)
  //第一条不处理
  const last = history.length > 2 ? history.at(-1) : undefined
  if (last && last.range.start == last.range.end) {
    const beforeIdx = last.range.start
    if (record.range.start == record.range.end) {
      const thisIdx = record.range.start
      const diff = thisIdx - beforeIdx
      if (0 <= diff) {
        if (record.value.startsWith(last.value) && record.value.length - last.value.length == diff) {
          //当前对之前是纯包含关系,直接替换
          history.pop()
          history.push(record)
          return {
            currentIndex: cdx,
            history
          }
        }
      }
    }
  }
  history.push(record)
  if (history.length > maxLength) {
    history.shift()
    return {
      currentIndex: cdx,
      history
    }
  }
  return {
    currentIndex: cdx + 1,
    history
  }
}
function isCtrl(e: KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}
export function addSimpleEvent(
  div: HTMLElement,
  model: StoreRef<ContentEditableModel>
) {
  div.addEventListener("input", function (e: React.FormEvent) {
    if (e.isComposing) {
      return
    }
    model.set(appendRecord(model.get(), getCurrentRecord(div)))
  } as any)
  div.addEventListener("compositionend", function () {
    model.set(appendRecord(model.get(), getCurrentRecord(div)))
  })

  div.addEventListener("keydown", function (e) {
    if (mb.DOM.keyCode.TAB(e)) {
      e.preventDefault()
      const record = contentTab(div, e.shiftKey)
      if (record) {
        model.set(appendRecord(model.get(), record))
      }
    } else if (mb.DOM.keyCode.ENTER(e)) {
      e.preventDefault()
      const record = contentEnter(div)
      model.set(appendRecord(model.get(), record))
    } else if (mb.DOM.keyCode.Z(e)) {
      if (isCtrl(e)) {
        if (e.shiftKey) {
          //redo
          e.preventDefault()
          model.set(redo(model.get()))
        } else {
          //undo
          e.preventDefault()
          model.set(undo(model.get()))
        }
      }
    } else if (mb.DOM.keyCode.BACKSPACE(e)) {
      e.preventDefault()
      const record = contentDelete(div)
      if (record) {
        model.set(appendRecord(model.get(), record))
      }
    }
  })
}