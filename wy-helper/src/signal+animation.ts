import {
  createAnimateSignal,
  defaultSpringAnimationConfig,
  DeltaXSignalAnimationConfig,
  SubscribeRequestAnimationFrame,
} from './animation';
import { GetValue, SetValue } from './setStateHelper';
import { addEffect, trackSignal } from './signal';
import { emptyObject } from './util';

export type AnimateFrameSignalConfig = {
  config?: DeltaXSignalAnimationConfig;
  onProcess?: SetValue<number>;
};
export function createObserverAnimateSignal(
  subscribeRequestAnimateFrame: SubscribeRequestAnimationFrame
) {
  return function (
    get: GetValue<number>,
    {
      config = g._signal_animation_with_ || defaultSpringAnimationConfig,
      onProcess,
    }: AnimateFrameSignalConfig = emptyObject
  ) {
    const value = createAnimateSignal(get(), subscribeRequestAnimateFrame);
    let lastValue = get();
    const destroy = trackSignal(get, v => {
      if (lastValue != v) {
        const tempValue = lastValue;
        lastValue = v;
        addEffect(() => {
          //先急设置
          value.set(tempValue);
          value.change(config(v - tempValue), onProcess);
        });
      }
    });
    return [value.get.bind(value), destroy] as const;
  };
}
const g = globalThis as unknown as {
  _signal_animation_with_?: DeltaXSignalAnimationConfig;
};

export function withAnimation(config: DeltaXSignalAnimationConfig) {
  g._signal_animation_with_ = config;
  addEffect(() => {
    g._signal_animation_with_ = undefined;
  }, -Infinity);
}
