import { binarytree } from "d3-binarytree";
import { quadtree } from "d3-quadtree";
import { octree } from "d3-octree";
import jiggle from "./jiggle";
import { DIMType, ForceDir, TreeNode } from "./forceModel";
import { Direction, ForceNode } from "./forceModel";
import { GetValue } from "../setStateHelper";
import { emptyObject } from "../util";


function getD(d: Direction) {
  return <T>(n: ForceNode<T>,) => {
    return n[d].d
  }
}
const g: {
  alpha: number
  node: ForceNode<any>
  nDim: DIMType
  distanceMax2: number
  theta2: number
  random: GetValue<number>
  distanceMin2: number
  getStrenth(n: any): number
} = {} as any
function defaultGetStrenth(n: any) {
  return -30
}

/**
 * 多体力
 * 模拟节点之间的吸引力或排斥力
 * @param param0 
 * @returns 
 */
export function forceManybody<T, V>(
  {
    distanceMax2 = Infinity,
    distanceMin2 = 1,
    theta2 = 0.81,
    random = Math.random,
    /**节点力的强度 */
    getStrenth = defaultGetStrenth
  }: {
    distanceMax2?: number
    distanceMin2?: number
    theta2?: number
    random?: GetValue<number>
    getStrenth?(n: ForceNode<T>): number
  } = emptyObject
) {
  return function (
    nodes: readonly ForceNode<T, ForceDir>[],
    nDim: DIMType,
    alpha: number
  ) {
    g.alpha = alpha
    g.nDim = nDim
    g.distanceMax2 = distanceMax2
    g.distanceMin2 = distanceMin2
    g.theta2 = theta2
    g.random = random
    g.getStrenth = getStrenth
    const tree =
      (g.nDim === 1 ? binarytree(nodes, getD('x'))
        : (g.nDim === 2 ? quadtree(nodes as any[], getD('x'), getD('y'))
          : (g.nDim === 3 ? octree(nodes, getD('x'), getD('y'), getD('z'))
            : null
          ))).visitAfter(accumulate);

    for (let i = 0, n = nodes.length; i < n; ++i) {
      g.node = nodes[i], tree.visit(apply);
    }
  }
}


function accumulate(treeNode: TreeNode<ForceNode<any>>) {
  var strength = 0, q, c, weight = 0, x, y, z, i;
  var numChildren = treeNode.length;

  // For internal nodes, accumulate forces from children.
  if (numChildren) {
    for (x = y = z = i = 0; i < numChildren; ++i) {
      if ((q = treeNode[i]) && (c = Math.abs(q.value))) {
        strength += q.value, weight += c, x += c * (q.x || 0), y += c * (q.y || 0), z += c * (q.z || 0);
      }
    }
    strength *= Math.sqrt(4 / numChildren); // scale accumulated strength according to number of dimensions

    treeNode.x = x / weight;
    if (g.nDim > 1) { treeNode.y = y / weight; }
    if (g.nDim > 2) { treeNode.z = z / weight; }
  }

  // For leaf nodes, accumulate forces from coincident nodes.
  else {
    q = treeNode;
    q.x = q.data.x.d;
    if (g.nDim > 1) { q.y = q.data.y.d; }
    if (g.nDim > 2) { q.z = q.data.z.d; }
    do strength += g.getStrenth(q.data);
    while (q = q.next);
  }

  treeNode.value = strength;
}

function apply(
  treeNode: TreeNode<ForceNode<any>>,
  x1: number,
  arg1: number,
  arg2: number,
  arg3: number) {
  if (!treeNode.value) return true;
  var x2 = [arg1, arg2, arg3][g.nDim - 1];

  var x = treeNode.x - g.node.x.d,
    y = (g.nDim > 1 ? treeNode.y - g.node.y.d : 0),
    z = (g.nDim > 2 ? treeNode.z - g.node.z.d : 0),
    w = x2 - x1,
    l = x * x + y * y + z * z;

  // Apply the Barnes-Hut approximation if possible.
  // Limit forces for very close nodes; randomize direction if coincident.
  if (w * w / g.theta2 < l) {
    if (l < g.distanceMax2) {
      if (x === 0) x = jiggle(g.random), l += x * x;
      if (g.nDim > 1 && y === 0) y = jiggle(g.random), l += y * y;
      if (g.nDim > 2 && z === 0) z = jiggle(g.random), l += z * z;
      if (l < g.distanceMin2) l = Math.sqrt(g.distanceMin2 * l);
      g.node.x.v += x * treeNode.value * g.alpha / l;
      if (g.nDim > 1) { g.node.y.v += y * treeNode.value * g.alpha / l; }
      if (g.nDim > 2) { g.node.z.v += z * treeNode.value * g.alpha / l; }
    }
    return true;
  }

  // Otherwise, process points directly.
  else if (treeNode.length || l >= g.distanceMax2) return;

  // Limit forces for very close nodes; randomize direction if coincident.
  if (treeNode.data !== g.node || treeNode.next) {
    if (x === 0) x = jiggle(g.random), l += x * x;
    if (g.nDim > 1 && y === 0) y = jiggle(g.random), l += y * y;
    if (g.nDim > 2 && z === 0) z = jiggle(g.random), l += z * z;
    if (l < g.distanceMin2) l = Math.sqrt(g.distanceMin2 * l);
  }

  do if (treeNode.data !== g.node) {
    w = g.getStrenth(treeNode.data.value) * g.alpha / l;
    g.node.x.v += x * w;
    if (g.nDim > 1) { g.node.y.v += y * w; }
    if (g.nDim > 2) { g.node.z.v += z * w; }
  } while (treeNode = treeNode.next);
}