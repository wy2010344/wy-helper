import {
  createSubscribeRequestAnimationFrame,
  SubscribeRequestAnimationFrame,
  createAnimateSignal,
  createObserverAnimateSignal,
  OneSetStoreRef,
} from 'wy-helper';
import { requestBatchAnimationFrame } from '../util';

export const getPerformanceNow = performance.now.bind(performance);
export const subscribeRequestAnimationFrame =
  createSubscribeRequestAnimationFrame(
    requestBatchAnimationFrame,
    getPerformanceNow
  );

export function animateSignal(
  value: number | OneSetStoreRef<number>,
  requestAnimateFrame: SubscribeRequestAnimationFrame = subscribeRequestAnimationFrame
) {
  return createAnimateSignal(value, requestAnimateFrame);
}

export const observerAnimateSignal = createObserverAnimateSignal(
  subscribeRequestAnimationFrame
);
