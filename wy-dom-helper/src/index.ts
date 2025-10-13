import { batchSignalEnd, createSignal } from 'wy-helper';

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
export { isEvent, addEvent } from './html/fx';
export type { UpdateProp } from './html/fx';

const w = createSignal(window.innerWidth);
const h = createSignal(window.innerHeight);
window.addEventListener('resize', function () {
  w.set(window.innerWidth);
  h.set(window.innerHeight);
  batchSignalEnd();
});
export const windowSize = {
  width: w.get,
  height: h.get,
};

export type ReadURLSearchParam = Omit<
  URLSearchParams,
  'append' | 'delete' | 'set'
>;
