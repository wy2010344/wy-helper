import { GetValue } from "../setStateHelper";
import { emptyObject } from "../util";
import jiggle from "./jiggle";
import { DIMType, ForceLink } from "./forceModel";




function defaultGetDistance() {
  return 30
}

/**
 * 链接力
 * @param param0 
 * @returns 
 */
export function forceLink<T, V>({
  random = Math.random,
  getDistance = defaultGetDistance,
  iterations = 1,
  getStrength: outGetStretch
}: {
  random?: GetValue<number>
  iterations?: number
  getDistance?(n: ForceLink<V, T>, i: number): number
  getStrength?(n: ForceLink<V, T>, i: number): number
} = emptyObject) {
  let lastLinks: any = undefined
  const bias: number[] = []//每个节点外连的数量
  const count: number[] = []//来源节点占比?
  const getStrength = outGetStretch || (link => {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  })

  function updateRelay(links: readonly ForceLink<V, T>[]) {
    if (lastLinks != links) {
      lastLinks = links
      bias.length = 0
      count.length = 0
      const m = links.length
      for (let i = 0; i < m; ++i) {
        const link = links[i]
        count[link.source.index] = (count[link.source.index] || 0) + 1;
        count[link.target.index] = (count[link.target.index] || 0) + 1;
      }
      for (let i = 0; i < m; ++i) {
        const link = links[i]
        bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
      }
    }
  }
  return function (links: readonly ForceLink<V, T>[], nDim: DIMType, alpha: number) {
    //惰性更新
    updateRelay(links)
    for (let k = 0; k < iterations; ++k) {
      let x = 0, y = 0, z = 0
      for (let i = 0; i < links.length; ++i) {
        const link = links[i]
        const source = link.source
        const target = link.target
        x = target.x.d + target.x.v - source.x.d - source.x.v || jiggle(random);
        if (nDim > 1) {
          y = target.y.d + target.y.v - source.y.d - source.y.v || jiggle(random);
        }
        if (nDim > 2) {
          z = target.z.d + target.z.v - source.z.d - source.z.v || jiggle(random);
        }
        let l = Math.sqrt(x * x + y * y + z * z);
        l = (l - getDistance(link, i)) / l * alpha * getStrength(link, i);
        x *= l, y *= l, z *= l;

        let b = bias[i]
        target.x.v -= x * b;
        if (nDim > 1) { target.y.v -= y * b; }
        if (nDim > 2) { target.z.v -= z * b; }
        b = 1 - b
        source.x.v += x * b;
        if (nDim > 1) { source.y.v += y * b; }
        if (nDim > 2) { source.z.v += z * b; }
      }
    }
  }
}