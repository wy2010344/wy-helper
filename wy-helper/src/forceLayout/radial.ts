import { DIMType, ForceNode } from "./forceModel";
import { asLazy } from "../util";
/**
 * 径向力
 * @param param0 
 * @returns 
 */
export function forceRadial<T, V>({
  x = 0,
  y = 0,
  z = 0,
  getRadius,
  getStrenth = asLazy(0.1)
}: {
  x?: number
  y?: number
  z?: number
  getRadius(n: ForceNode<T>): number
  getStrenth?(n: ForceNode<T>): number
}) {
  return function (
    nodes: readonly ForceNode<T>[],
    nDim: DIMType,
    alpha: number
  ) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var node = nodes[i],
        dx = node.x.d - x || 1e-6,
        dy = (node.y.d || 0) - y || 1e-6,
        dz = (node.z.d || 0) - z || 1e-6,
        r = Math.sqrt(dx * dx + dy * dy + dz * dz),
        k = (getRadius(node) - r) * getStrenth(node) * alpha / r;
      node.x.v += dx * k;
      if (nDim > 1) { node.y.v += dy * k; }
      if (nDim > 2) { node.z.v += dz * k; }
    }
  }
}