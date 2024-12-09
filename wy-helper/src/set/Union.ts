import { removeWhere } from "wy-helper";
import { AllMayType } from ".";
import { include } from "./include";

export class Union<T> {
  constructor(
    public readonly list: T[]
  ) { }
}
function unionToList(a: AllMayType, slice?: boolean) {
  return a instanceof Union ? slice ? a.list.slice() : a.list : [a]
}

export function toUnion(a: AllMayType, b: AllMayType): AllMayType {
  const axs = unionToList(a, true)
  const bxs = unionToList(b)
  bxs.forEach(bx => {
    if (!axs.find(v => include(v, bx))) {
      removeWhere(axs, v => include(bx, v))
      axs.push(bx)
    }
  })
  if (axs.length > 1) {
    return new Union(axs)
  }
  return axs[0]
}



export function toUnions(a: AllMayType, b: AllMayType, ...vs: AllMayType[]) {
  let c = toUnion(a, b)
  for (const v of vs) {
    c = toUnion(c, v)
  }
  return c
}