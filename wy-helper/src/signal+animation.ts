import { AbsAnimateFrameValue, GetDeltaXAnimationConfig } from "./animation"
import { GetValue } from "./setStateHelper"
import { trackSignal } from "./signal"

export function createAnimateSignal(
  create: (v: number) => AbsAnimateFrameValue,
  get: GetValue<number>,
  config: GetDeltaXAnimationConfig
) {
  const value = create(get())
  const destroy = trackSignal(get, v => {
    const to = value.getTargetValue()
    if (to != v) {
      value.changeTo(v, config, {
        from: to
      })
    }
  })
  return [value.get.bind(value), destroy] as const
}
