import { ReorderChild, Box, Point, emptyFun, PointKey } from 'wy-helper';
import { getPageOffset, subscribeEventListener } from './util';
import { subscribeRequestAnimationFrame } from './animation';

export function subscribeScroller(
  container: HTMLElement,
  direction: PointKey,
  change: (v: number) => any
) {
  const key = direction == 'x' ? 'scrollLeft' : 'scrollTop';
  let value = container[key];
  return subscribeEventListener(container, 'scroll', e => {
    const newValue = container[key];
    const diff = newValue - value;
    if (change(diff)) {
      value = newValue;
    }
  });
}
export function subscribeScrollerAll(
  container: HTMLElement,
  change: (v: Point) => any
) {
  const point = {
    x: container.scrollLeft,
    y: container.scrollTop,
  };
  return subscribeEventListener(container, 'scroll', e => {
    const newLeft = container.scrollLeft;
    const newTop = container.scrollTop;
    const diff = {
      x: newLeft - point.x,
      y: newTop - point.y,
    };
    if (change(diff)) {
      point.x = newLeft;
      point.y = newTop;
    }
  });
}
export function reorderChildChangeIndex<K>(
  child: ReorderChild<K>,
  div: HTMLElement,
  onLayout: (diff: Point) => void,
  updateBox: (box: Box) => void = emptyFun
) {
  function animateFrmae() {
    const axisV = getPageLayoutData(div);
    updateBox(axisV);
    child.animateFrame(axisV, onLayout);
  }
  //index改变,即触发布局改变,显式调用一下.
  animateFrmae();
  child.releaseLock();
  return subscribeRequestAnimationFrame(animateFrmae);
}

export function getPageLayoutData(div: HTMLElement) {
  const loc = getPageOffset(div);
  const width = div.clientWidth;
  const height = div.clientHeight;
  const newB: Box = {
    x: {
      min: loc.x,
      max: loc.x + width,
    },
    y: {
      min: loc.y,
      max: loc.y + height,
    },
  };
  return newB;
}
