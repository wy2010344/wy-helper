import { batchSignalEnd, createSignal, getGlobalThis } from 'wy-helper';

export * from './dragMove';
export * from './hightlightHelper';
export * from './stylis';
export * from './prismHelper';
export * from './cssAnimationHelper';
export * from './util';
export * from './animation';
export * from './indexedDBHelper';
export * from './reorder';
export * from './onMove';
export * from './moveEdgeScroll';
export * from './html/html';
export * from './getAttributeAlias';
export * from './html/updateDom';
export * from './balanceSize';
export * from './loadImage';
export * from './html/fhtml';
export * from './html/xhtml';
export * from './html/mhtml';
export * from './input';
export * from './html/moveChildren';
export * from './cssObjectToString';
export { isEvent, addEvent } from './html/fx';
export type { UpdateProp } from './html/fx';

const win = getGlobalThis().window;
const w = createSignal(win?.innerWidth ?? 0);
const h = createSignal(win?.innerHeight ?? 0);

let resizeListening = false;
function ensureResizeListener() {
  if (resizeListening || !win) {
    return;
  }
  resizeListening = true;
  win.addEventListener('resize', function () {
    w.set(win.innerWidth);
    h.set(win.innerHeight);
    batchSignalEnd();
  });
}

export const windowSize = {
  width() {
    ensureResizeListener();
    return w.get();
  },
  height() {
    ensureResizeListener();
    return h.get();
  },
};

export type ReadURLSearchParam = Omit<
  URLSearchParams,
  'append' | 'delete' | 'set'
>;

const dpr = createSignal(win?.devicePixelRatio || 1);

let dprListening = false;
function ensureDprListener() {
  if (dprListening || !win || typeof win.matchMedia != 'function') {
    return;
  }
  dprListening = true;
  win
    .matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`)
    .addEventListener('change', () => {
      dpr.set(win.devicePixelRatio);
      batchSignalEnd();
    });
}

export const devicePixelRatio = {
  get() {
    ensureDprListener();
    return dpr.get();
  },
  set(v: number) {
    ensureDprListener();
    return dpr.set(v);
  },
};
