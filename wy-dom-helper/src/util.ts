export function createScript(src: string) {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
  return script;
}

export function createLink(href: string) {
  const link = document.createElement('link');
  link.href = href;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  return link;
}

/**如果是通过点击label过来的,最好附加在label内,否则会滚动到输入框 */
function createFileInput(id?: string) {
  const input = document.createElement('input');
  input.style.position = 'absolute';
  input.style.left = '-1px';
  input.style.top = '-1px';
  input.style.width = '0px';
  input.style.height = '0px';
  input.setAttribute('type', 'file');
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
  multiple,
  accept,
  onChange,
}: {
  multiple?: boolean;
  accept?: string;
  onChange(...files: File[]): Promise<any>;
}) {
  const input = createFileInput();
  if (accept) {
    input.setAttribute('accept', accept);
  }
  if (multiple) {
    input.multiple = true;
  }
  input.addEventListener('change', async function (e) {
    if (input.files?.length) {
      await onChange(...toList(input.files));
    }
    input.remove();
  });
  input.click();
}

function toList(files: FileList) {
  const vs: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const v = files.item(i);
    if (v) {
      vs.push(v);
    }
  }
  return vs;
}

export function cns(...vs: (string | FalseType)[]) {
  return vs.filter(quote).join(' ');
}

export function readFileAs(file: File, as: 'dataUrl'): Promise<string>;
export function readFileAs(file: File, as: 'arrayBuffer'): Promise<ArrayBuffer>;
export function readFileAs(file: File): Promise<string>;
export function readFileAs(file: File, as?: 'dataUrl' | 'arrayBuffer') {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(reader.result);
    };
    reader.onerror = function (e) {
      reject(reader.error);
    };
    if (as == 'arrayBuffer') {
      reader.readAsArrayBuffer(file);
    } else if (as == 'dataUrl') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export function delayAnimationFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
}

export function stringifyStyle(style: CSSProperties) {
  const s = Object.entries(style)
    .map(function (v) {
      return `${underlineToCamel(v[0])}:${v[1]};`;
    })
    .join('');
  return s;
}

export function underlineToCamel(str: string) {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
}

export function getTrim(v: string) {
  return v.trim();
}
/**
 * 先就简单这么分割吧,如果文字还\n,\t,会以之分割并中断
 * @param names
 * @returns
 */
export function splitClassNames(names: string) {
  return new Set(names.split(' ').map(getTrim).filter(quote));
}

import * as CSS from 'csstype';
import {
  EmptyFun,
  FalseType,
  Point,
  SetValue,
  batchSignalEnd,
  buildThrottle,
  quote,
  run,
} from 'wy-helper';
export type PureCSSProperties = CSS.Properties<string | number>;
export interface CSSProperties extends PureCSSProperties {
  [key: `--${string}`]: string | number | undefined;
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
  const observer = new IntersectionObserver(callback, options);
  observer.observe(flag);
  return function () {
    observer.unobserve(flag);
    observer.disconnect();
  };
}

export function getCommonParentNode(oNode1: Element | null, oNode2: Element) {
  while (true) {
    if (!oNode1) {
      return oNode2;
    }
    if (oNode1.contains(oNode2)) {
      return oNode1;
    }
    oNode1 = oNode1.parentNode as Element;
  }
}

export function requestBatchAnimationFrame(fun: SetValue<number>) {
  const list = cacheList[0];
  list.push(fun);
  if (list.length == 1) {
    requestAnimationFrame(clearCacheList);
  }
}
const cacheList: [SetValue<number>[], SetValue<number>[]] = [[], []];
function clearCacheList(n: number) {
  const list = cacheList.shift()!;
  cacheList.push(list);
  list.forEach(run => run(n));
  list.length = 0;
  //这里统一调一下
  batchSignalEnd();
}

/**
 * 获得元素排除translateX,translateY的位置
 * @param element
 * @returns
 */
export function getPageOffset(element: HTMLElement) {
  const point: Point = {
    x: 0,
    y: 0,
  };
  while (element) {
    point.x = point.x + element.offsetLeft;
    point.y = point.y + element.offsetTop;
    element = element.offsetParent as any;
  }
  return point;
}
export function requestAnimationFrameThrottle(call: EmptyFun): EmptyFun;
export function requestAnimationFrameThrottle<T>(
  call: SetValue<T>
): SetValue<T>;
export function requestAnimationFrameThrottle(call: EmptyFun): EmptyFun {
  return buildThrottle(requestBatchAnimationFrame, call);
}

// 定义 subscribeEventListener 函数
export function subscribeEventListener<
  T extends EventTarget,
  K extends keyof EventMap<T>,
>(
  target: T,
  type: K,
  listener: (
    event: Omit<EventMap<T>[K], 'currentTarget'> & {
      currentTarget: T;
    }
  ) => void,
  options?: boolean | AddEventListenerOptions
) {
  target.addEventListener(
    type as any,
    listener as unknown as EventListener,
    options
  );
  return function () {
    target.removeEventListener(
      type as any,
      listener as unknown as EventListener,
      options
    );
  };
}
// 获取特定目标的事件映射表
type EventMap<T> = T extends Document
  ? DocumentEventMap
  : T extends HTMLElement
    ? HTMLElementEventMap
    : T extends SVGSVGElement
      ? SVGElementEventMap
      : T extends Window
        ? WindowEventMap
        : Record<string, Event>; // 默认返回通用 Event 类型
