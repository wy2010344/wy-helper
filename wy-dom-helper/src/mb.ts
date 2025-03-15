import { asLazy, cacheGet } from "wy-helper"

type MBKeyboard = {
  code?: string
  keyCode: number,
  key: string
}
function isKey(v: number, key: string, code?: string) {
  if (code) {
    return function (e: MBKeyboard) {
      return (e.keyCode == v || e.key == key) && e.code == code
    }
  } else {
    return function (e: MBKeyboard) {
      return e.keyCode == v || e.key == key
    }
  }
}

function restoreVerifyPos(pos: MbRange) {
  var _a;
  var dir = pos.dir;
  var start = pos.start;
  var end = pos.end;
  if (!dir) {
    dir = "->";
  }
  if (start < 0) {
    start = 0;
  }
  if (end < 0) {
    end = 0;
  }
  if (dir == "<-") {
    //交换开始与结束的位置，以便顺序遍历
    _a = [end, start], start = _a[0], end = _a[1];
  }
  return [start, end, dir] as const
}
function visit(editor: Node, visitor: (el: Node) => boolean | void) {
  var queue = [];
  if (editor.firstChild) {
    queue.push(editor.firstChild);
  }
  var el = queue.pop();
  while (el) {
    if (visitor(el)) {
      break;
    }
    if (el.nextSibling) {
      queue.push(el.nextSibling);
    }
    if (el.firstChild) {
      queue.push(el.firstChild);
    }
    el = queue.pop();
  }
};
export interface MbRange {
  start: number
  end: number
  dir?: "->" | "<-"
}

export const mb = {
  DOM: {
    supportTouch: cacheGet(() => {
      return 'ontouchstart' in window
    }),
    addEvent(v: any, key: string, fun: any) {
      v.addEventListener(key, fun)
    },
    removeEvent(v: any, key: string, fun: any) {
      v.removeEventListener(key, fun)
    },
    preventDefault(e: any) {
      e.preventDefault()
    },
    stopPropagation(e: any) {
      e.stopPropagation()
    },
    getSelectionRange(editor: HTMLElement): MbRange | null {
      let { anchorNode, anchorOffset, focusNode, focusOffset } = getSelection(editor);
      if (!anchorNode || !focusNode) return null
      if (anchorNode == editor && focusNode == editor) {
        // If the anchor and focus are the editor element, return either a full
        // highlight or a start/end cursor position depending on the selection
        return {
          start: (anchorOffset > 0 && editor.textContent) ? editor.textContent.length : 0,
          end: (focusOffset > 0 && editor.textContent) ? editor.textContent.length : 0,
          dir: (focusOffset >= anchorOffset) ? '->' : '<-'
        }
      }

      // Selection anchor and focus are expected to be text nodes,
      // so normalize them.
      if (anchorNode.nodeType === Node.ELEMENT_NODE) {
        const node = document.createTextNode('')
        anchorNode.insertBefore(node, anchorNode.childNodes[anchorOffset])
        anchorNode = node
        anchorOffset = 0
      }
      if (focusNode.nodeType === Node.ELEMENT_NODE) {
        const node = document.createTextNode('')
        focusNode.insertBefore(node, focusNode.childNodes[focusOffset])
        focusNode = node
        focusOffset = 0
      }


      var pos: MbRange = { start: 0, end: 0 };
      visit(editor, function (el) {
        if (el == anchorNode && el == focusNode) {
          pos.start += anchorOffset
          pos.end += focusOffset
          pos.dir = anchorOffset <= focusOffset ? '->' : '<-'
          return true
        }


        if (el === anchorNode) {
          pos.start += anchorOffset
          if (!pos.dir) {
            pos.dir = '->'
          } else {
            return true
          }
        } else if (el === focusNode) {
          pos.end += focusOffset
          if (!pos.dir) {
            pos.dir = '<-'
          } else {
            return true
          }
        }

        if (el.nodeType === Node.TEXT_NODE) {
          if (pos.dir != '->') pos.start += el.nodeValue!.length
          if (pos.dir != '<-') pos.end += el.nodeValue!.length
        }
      });
      // collapse empty text nodes
      editor.normalize()
      return pos;
    },

    setSelectionRange(editor: HTMLElement, _pos: MbRange | null) {
      if (!_pos) {
        const s = getSelection(editor)
        s.removeAllRanges()
        return s
      }
      const pos = { ..._pos }
      const s = getSelection(editor)
      let startNode: Node | undefined, startOffset = 0
      let endNode: Node | undefined, endOffset = 0

      if (!pos.dir) pos.dir = '->'
      if (pos.start < 0) pos.start = 0
      if (pos.end < 0) pos.end = 0

      // Flip start and end if the direction reversed
      if (pos.dir == '<-') {
        const { start, end } = pos
        pos.start = end
        pos.end = start
      }

      let current = 0

      visit(editor, el => {
        if (el.nodeType !== Node.TEXT_NODE) return

        const len = (el.nodeValue || '').length
        if (current + len > pos.start) {
          if (!startNode) {
            startNode = el
            startOffset = pos.start - current
          }
          if (current + len > pos.end) {
            endNode = el
            endOffset = pos.end - current
            return true
          }
        }
        current += len
      })

      if (!startNode) startNode = editor, startOffset = editor.childNodes.length
      if (!endNode) endNode = editor, endOffset = editor.childNodes.length

      // Flip back the selection
      if (pos.dir == '<-') {
        [startNode, startOffset, endNode, endOffset] = [endNode, endOffset, startNode, startOffset]
      }

      s.setBaseAndExtent(startNode, startOffset, endNode, endOffset)

      return s
    },

    keyCode: {
      BACKSPACE: isKey(8, "Backspace"),
      ENTER: isKey(13, "Enter"),
      TAB: isKey(9, "Tab"),
      ESCAPE: isKey(27, "Escape"),
      CAPSLOCK: isKey(20, 'CapsLock'),

      ARROWLEFT: isKey(37, "ArrowLeft"),
      ARROWUP: isKey(38, "ArrowUp"),
      ARROWRIGHT: isKey(39, "ArrowRight"),
      ARROWDOWN: isKey(40, "ArrowDown"),

      CONTROL: isKey(17, "Control"),

      /**shift键 */
      SHIFT: isKey(16, 'Shift'),
      SHIFTLEFT: isKey(16, 'Shift', 'ShiftLeft'),
      SHIFTRIGHT: isKey(16, 'Shift', 'ShiftRight'),

      /**windows键 */
      META: isKey(91, "Meta"),
      METALEFT: isKey(91, "Meta", "MetaLeft"),
      METARIGHT: isKey(91, "Meta", "MetaRight"),

      /**ALT键 */
      ALT: isKey(18, "Alt"),
      ALTLEFT: isKey(18, "Alt", "AltLeft"),
      ALTRIGHT: isKey(18, "Alt", "AltRight"),


      A: isKey(65, 'a'),
      Z: isKey(90, "z"),
      V: isKey(86, "v"),
      C: isKey(67, "c"),
      X: isKey(88, "x")
    }
  },
  isIE: false,
  browser: {
    type: "IE",
    version: 0,
    documentMode: 0
  } as Browser
}
type Browser = {
  type: "IE" | "FF" | "Opera" | "Safari",
  version: number
  documentMode: any
}
export const browser = (function () {
  //http://www.jb51.net/article/50464.htm
  var ret: Browser = {
    type: "FF", version: 0, documentMode: ""
  };
  if (!globalThis.navigator) {
    return ret
  }
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
  var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
  var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
  var isSafari = userAgent.indexOf("Safari") > -1; //判断是否Safari浏览器
  if (isIE) {
    mb.isIE = true;
    var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
    reIE.test(userAgent);
    ret.type = "IE";
    ret.version = parseFloat(RegExp["$1"]);
    ret.documentMode = (document as any).documentMode;//IE的文档模式
  }
  if (isFF) {
    ret.type = "FF";
  }
  if (isOpera) {
    ret.type = "Opera";
  }
  if (isSafari) {
    ret.type = "Safari";
  }
  return ret;
})();





export function initRecord(content: string) {
  return {
    scrollLeft: 0,
    scrollTop: 0,
    range: {
      start: content.length,
      end: content.length,
    },
    value: content,
  };
}

export function getSelection(editor: HTMLElement) {
  if (editor.parentNode?.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
    return (editor.parentNode as Document).getSelection()!
  }
  return window.getSelection()!
}

export function insertHTML(text: string) {
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
  document.execCommand("insertHTML", false, text)
}

export function beforeCursor(editor: HTMLElement) {
  const s = getSelection(editor)
  const r0 = s.getRangeAt(0)
  const r = document.createRange()
  r.selectNodeContents(editor)
  r.setEnd(r0.startContainer, r0.startOffset)
  return r.toString()
}
export function afterCursor(editor: HTMLElement) {
  const s = getSelection(editor)
  const r0 = s.getRangeAt(0)
  const r = document.createRange()
  r.selectNodeContents(editor)
  r.setStart(r0.endContainer, r0.endOffset)
  return r.toString()
}








var _vendor = asLazy(function () {
  var _elementStyle = document.createElement('div').style;
  var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
    transform,
    i = 0,
    l = vendors.length;

  for (; i < l; i++) {
    transform = vendors[i] + 'ransform';
    if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
  }

  return false;
})();
/**
 * 加前缀
 * @param style 
 * @returns 
 */
function prefixStyle(style: string) {
  const v = _vendor()
  if (v === false) return false;
  if (v === '') return style;
  return v + style.charAt(0).toUpperCase() + style.substr(1);
}