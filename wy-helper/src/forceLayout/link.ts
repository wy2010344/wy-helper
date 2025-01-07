import { GetValue, emptyObject } from "wy-helper";
import jiggle from "./jiggle";
import { ForceLink, NodeForce } from ".";




function defaultGetDistance() {
  return 30
}

/**
 * 链接力
 * @param param0 
 * @returns 
 */
export default function <T, V>({
  random = Math.random,
  getDistance = defaultGetDistance,
  iterations = 1,
  getStrength: outGetStretch
}: {
  random?: GetValue<number>
  iterations?: number
  getDistance?(n: ForceLink<V, T>, i: number): number
  getStrength?(n: ForceLink<V, T>, i: number): number
} = emptyObject): NodeForce<T, V> {
  return function (nodes, nDim, links) {
    const m = links.length,
      count: number[] = []
    const bias: number[] = []

    const getStrength = outGetStretch || (link => {
      return 1 / Math.min(count[link.source.index], count[link.target.index]);
    })
    for (let i = 0; i < m; ++i) {
      const link = links[i]
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (let i = 0; i < m; ++i) {
      const link = links[i]
      bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }



    return function (alpha, nodes, links) {
      for (var k = 0, n = links.length; k < iterations; ++k) {
        for (var i = 0,
          x = 0, y = 0, z = 0, l, b;
          i < links.length;
          ++i
        ) {
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
          l = Math.sqrt(x * x + y * y + z * z);
          l = (l - getDistance(link, i)) / l * alpha * getStrength(link, i);
          x *= l, y *= l, z *= l;

          target.x.v -= x * (b = bias[i]);

          if (nDim > 1) { target.y.v -= y * b; }
          if (nDim > 2) { target.z.v -= z * b; }

          source.x.v += x * (b = 1 - b);
          if (nDim > 1) { source.y.v += y * b; }
          if (nDim > 2) { source.z.v += z * b; }
        }
      }
    }
  }
}