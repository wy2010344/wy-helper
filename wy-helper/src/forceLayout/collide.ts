import { binarytree } from 'd3-binarytree';
import { quadtree } from 'd3-quadtree';
import { octree } from 'd3-octree';
import { Direction, ForceNode, TreeNode } from './forceModel';
import { DIMType } from './forceModel';
import jiggle from './jiggle';
import { GetValue } from '../setStateHelper';
import { emptyObject } from '../util';

function getDV(d: Direction) {
  return <T>(n: ForceNode<T>) => {
    const m = n[d];
    return m.d + m.v;
  };
}
function defaultGetRadius() {
  return 1;
}
/**
 * 碰撞力,根据节点半径而来
 * @param param0
 * @returns
 */
export function forceCollide<T>({
  strength = 1,
  iterations = 1,
  random = Math.random,
  getRadius = defaultGetRadius,
}: {
  strength?: number;
  iterations?: number;
  random?: GetValue<number>;
  getRadius?(n: ForceNode<T>): number;
} = emptyObject) {
  return function (nodes: readonly ForceNode<T>[], nDim: DIMType) {
    g.nDim = nDim;
    g.strength = strength;
    g.getRadius = getRadius;
    g.random = random;
    for (let k = 0; k < iterations; ++k) {
      const tree = (
        nDim === 1
          ? binarytree(nodes, getDV('x'))
          : nDim === 2
            ? quadtree(nodes as any[], getDV('x'), getDV('y'))
            : nDim === 3
              ? octree(nodes, getDV('x'), getDV('y'), getDV('z'))
              : null
      ).visitAfter(prepare);

      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        g.node = node;
        g.ri = getRadius(node);
        g.ri2 = g.ri * g.ri;
        g.xi = node.x.d + node.x.v;
        if (nDim > 1) {
          g.yi = node.y.d + node.y.v;
        }
        if (nDim > 2) {
          g.zi = node.z.d + node.z.v;
        }
        tree.visit(apply);
      }
    }
  };
}
const g: {
  nDim: DIMType;
  node: ForceNode<any>;
  xi: number;
  yi: number;
  zi: number;
  ri: number;
  ri2: number;
  strength: number;
  random: GetValue<number>;
  getRadius(n: any): number;
} = {} as any;

function apply(
  treeNode: TreeNode<ForceNode<any>>,
  arg1: number,
  arg2: number,
  arg3: number,
  arg4: number,
  arg5: number,
  arg6: number
) {
  const args = [arg1, arg2, arg3, arg4, arg5, arg6];
  const x0 = args[0],
    y0 = args[1],
    z0 = args[2],
    x1 = args[g.nDim],
    y1 = args[g.nDim + 1],
    z1 = args[g.nDim + 2];

  let data = treeNode.data,
    rj = treeNode.r,
    r = g.ri + rj;
  if (data) {
    if (data.index > g.node.index) {
      let x = g.xi - data.x.d - data.x.v,
        y = g.nDim > 1 ? g.yi - data.y.d - data.y.v : 0,
        z = g.nDim > 2 ? g.zi - data.z.d - data.z.v : 0,
        l = x * x + y * y + z * z;
      if (l < r * r) {
        if (x === 0) ((x = jiggle(g.random)), (l += x * x));
        if (g.nDim > 1 && y === 0) ((y = jiggle(g.random)), (l += y * y));
        if (g.nDim > 2 && z === 0) ((z = jiggle(g.random)), (l += z * z));
        l = ((r - (l = Math.sqrt(l))) / l) * g.strength;

        g.node.x.v += (x *= l) * (r = (rj *= rj) / (g.ri2 + rj));
        if (g.nDim > 1) {
          g.node.y.v += (y *= l) * r;
        }
        if (g.nDim > 2) {
          g.node.z.v += (z *= l) * r;
        }

        data.x.v -= x * (r = 1 - r);
        if (g.nDim > 1) {
          data.y.v -= y * r;
        }
        if (g.nDim > 2) {
          data.z.v -= z * r;
        }
      }
    }
    return;
  }
  return (
    x0 > g.xi + r ||
    x1 < g.xi - r ||
    (g.nDim > 1 && (y0 > g.yi + r || y1 < g.yi - r)) ||
    (g.nDim > 2 && (z0 > g.zi + r || z1 < g.zi - r))
  );
}

function prepare(treeNode: TreeNode<ForceNode<any>>) {
  if (treeNode.data) {
    return (treeNode.r = g.getRadius(treeNode.data));
  }
  for (let i = (treeNode.r = 0); i < Math.pow(2, g.nDim); ++i) {
    if (treeNode[i] && treeNode[i].r > treeNode.r) {
      treeNode.r = treeNode[i].r;
    }
  }
}
