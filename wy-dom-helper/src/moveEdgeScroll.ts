import {
  EdgeScrollConfig,
  PagePoint,
  PointKey,
  ValueOrGet,
  edgeScrollChange,
  valueOrGetToGet,
} from 'wy-helper';
import { subscribeRequestAnimationFrame } from './animation';

export type MoveEdgeScrollProps<E = PagePoint> = {
  point: E;
  getPoint?(n: E, dir: PointKey): number;
  direction: ValueOrGet<PointKey>;
  config?: EdgeScrollConfig;
  scrollDiff?(d: number): void;
  getSpeed?(diff: number, padding: number): number;
};
const defConfig: EdgeScrollConfig = {
  padding: 40,
  config: true,
};

function defaultGetPoint(e: PagePoint, d: PointKey) {
  if (d == 'x') {
    return e.pageX;
  }
  return e.pageY;
}
/**
 *
 * 鼠标移动到滚动区域外,滚动到此外
 * 如果是mouseMove事件触发,只在触发时生效
 * 所以要动画检测
 *
 * 似乎不应该是状态驱动的，而应该是事件驱动的。但比如拖拽，可能来源不同，只有一个状态驱动
 * @param container
 * @param param1 {
 * }
 * @returns
 */
export function moveEdgeScroll<E = PagePoint>(
  container: HTMLElement,
  {
    point,
    getPoint = defaultGetPoint as any,
    direction: _direction,
    config = defConfig,
    scrollDiff,
    /**速度是多少，可能是一个固定值 */
    getSpeed = (n, padding) => (n * 12) / padding,
  }: MoveEdgeScrollProps<E>
) {
  const getDirection = valueOrGetToGet(_direction);
  const rect = container.getBoundingClientRect();

  let cacheX:
    | {
        min: number;
        max: number;
      }
    | undefined = undefined;

  let cacheY:
    | {
        min: number;
        max: number;
      }
    | undefined = undefined;
  function getAxis() {
    const direction = getDirection();
    if (direction == 'x') {
      cacheX = cacheX || {
        min: rect.left,
        max: rect.right,
      };
      return cacheX;
    } else {
      cacheY = cacheY || {
        min: rect.top,
        max: rect.bottom,
      };
      return cacheY;
    }
  }
  const update = edgeScrollChange(config, function (diff, padding) {
    if (getDirection() == 'x') {
      container.scrollLeft += getSpeed(diff, padding);
      scrollDiff?.(diff);
    } else {
      container.scrollTop += getSpeed(diff, padding);
      scrollDiff?.(diff);
    }
  });
  update(getPoint(point, getDirection()), getAxis());
  return {
    changePoint(n: E) {
      point = n;
    },
    destroy: subscribeRequestAnimationFrame(() => {
      update(getPoint(point, getDirection()), getAxis());
    }),
  };
}
