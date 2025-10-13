import { asLazy, emptyObject } from '../util';
import { CallBackNode, Direction, ForceDir, ForceNode } from './forceModel';

/**
 * x-y-z力,主要是中心,将点吸引到特定位置
 * @param dir
 * @param param1
 * @returns
 */
export function forceDir<T>(
  dir: Direction,
  {
    getZ = asLazy(0),
    getStrength = asLazy(0.1),
  }: {
    /**力的位置 */
    getZ?: CallBackNode<T, number>;
    /**力的强度 */
    getStrength?: CallBackNode<T, number>;
  } = emptyObject
) {
  return function (nodes: readonly ForceNode<T, ForceDir>[], alpha: number) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i];
      node[dir].v +=
        (getZ(node, i, nodes) - node[dir].d) *
        getStrength(node, i, nodes) *
        alpha;
    }
  };
}
