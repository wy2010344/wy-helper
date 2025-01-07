import { AbsAnimateFrameValue, defaultSpringBaseAnimationConfig, easeFns, GetDeltaXAnimationConfig } from "./animation"
import { GetValue } from "./setStateHelper"
import { addEffect, trackSignal } from "./signal"
import { emptyObject } from "./util"


export type AnimateFrameSignalConfig = {
  config?: GetDeltaXAnimationConfig
  onProcess?(v: number): void
  onFinish?(v: boolean): void
}
export function createAnimateSignal(
  create: (v: number) => AbsAnimateFrameValue,
  get: GetValue<number>,
  {
    config = defaultSpringBaseAnimationConfig,
    onFinish,
    onProcess,
  }: AnimateFrameSignalConfig = emptyObject,
) {
  const value = create(get())
  const destroy = trackSignal(get, v => {
    const to = value.getTargetValue()
    if (to != v) {
      value.changeTo(v, g._signal_animation_with_ || config, {
        from: to,
        onProcess,
        onFinish
      })
    }
  })
  return [value.get.bind(value), destroy] as const
}


const g = globalThis as unknown as {
  _signal_animation_with_?: GetDeltaXAnimationConfig
}

export function withAnimation(config: GetDeltaXAnimationConfig) {
  g._signal_animation_with_ = config
  addEffect(() => {
    g._signal_animation_with_ = undefined
  }, -Infinity)
}