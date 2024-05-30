import { AnimationConfig, SpringOutValue } from "../animation"

export function getDestination(value: number, lowerMargin: number, upperMargin: number) {
  if (value <= lowerMargin) {
    return lowerMargin
  }
  if (upperMargin <= value) {
    return upperMargin
  }
  return value
}




export class ScrollEdgeAnimation implements AnimationConfig {
  constructor(
    public readonly before: AnimationConfig,
    public readonly duration: number,
    public readonly deltaX: number,
    public readonly backDeltax: number,
    public readonly onEdgeBack: AnimationConfig
  ) { }
  initFinished(deltaX: number): boolean {
    return this.before.initFinished(this.deltaX)
  }
  computed(diffTime: number, deltaX: number): SpringOutValue {
    const dx = diffTime - this.duration
    if (dx > 0) {
      return this.onEdgeBack.computed(dx, this.backDeltax)
    }
    return this.before.computed(diffTime, this.deltaX)
  }
  finished(diffTime: number, out?: SpringOutValue | undefined): boolean {
    const dx = diffTime - this.duration
    if (dx > 0) {
      return this.onEdgeBack.finished(dx, out)
    }
    return false
  }
}