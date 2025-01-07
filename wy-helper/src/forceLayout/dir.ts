import { asLazy, emptyObject } from "wy-helper";
import { CallBackNode, Direction, NodeForce } from ".";




/**
 * x-y-z力,主要是中心,将点吸引到特定位置
 * @param dir 
 * @param param1 
 * @returns 
 */
export default function <T, V>(
  dir: Direction,
  {
    getZ = asLazy(0),
    getStrength = asLazy(0.1)
  }: {
    /**力的位置 */
    getZ?: CallBackNode<T, number>,
    /**力的强度 */
    getStrength?: CallBackNode<T, number>
  } = emptyObject
): NodeForce<T, V> {
  return function (nodes) {
    return function (alpha, nodes) {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i]
        node[dir].v += (
          getZ(node, i, nodes) - node[dir].d
        ) * getStrength(node, i, nodes) * alpha;
      }
    }
  }
}