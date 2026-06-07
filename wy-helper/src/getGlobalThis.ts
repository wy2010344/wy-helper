import { cacheGet, quoteOrLazyGet } from './util';

export const getGlobalThis = cacheGet(() => {
  if (typeof window == 'undefined') {
    return globalThis;
  }

  //找到最外层的同源窗口
  let found: Window = window;
  let current: Window = window;
  while (current != window.top) {
    current = current.parent;
    try {
      current.location.href;
      found = current;
    } catch (e) {
      //跨域阻断，继续向上
    }
  }
  return found;
});
