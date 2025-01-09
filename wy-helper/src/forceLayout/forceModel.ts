import { ArrayHelper } from "../ArrayHelper"
import { arrayEqual } from "../equal"
import { quote, ReadArray } from "../util"

export type TreeNode<T> = {
  x: number
  y: number
  z: number
  r: number
  value: number
  data: T
  next: TreeNode<T>
} & Array<TreeNode<T>>

export type CallBackNode<T, F> = (node: ForceNode<T>, i: number, nodes: readonly ForceNode<T>[]) => F

/**
 * 使用get/set来处理
 */
export type ForceDir = {
  /**速度 */
  v: number
  /**位移 */
  d: number
  /**固定位置 */
  f?: number
}

export type Direction = "x" | "y" | "z"

export type ForceNode<T, FDir extends ForceDir = ForceDir> = {
  index: number
  x: FDir
  y: FDir
  z: FDir
  value: T
}

export type DIMType = 1 | 2 | 3
const initialRadius = 10,
  initialAngleRoll = Math.PI * (3 - Math.sqrt(5)), // Golden ratio angle
  initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221)); // Markov irrational number




interface MergeNodesAndLinks<N, L, K, FDir extends ForceDir = ForceDir> {
  (arg: {
    nodes: readonly ForceNode<N, FDir>[],
    links: readonly ForceLink<L, N, FDir>[],
    fromNodes: ReadArray<N>,
    fromLinks: ReadArray<L>,
    getNodeKey(n: N): K,
    getSorceKey(n: L): K,
    getTargetKey(n: L): K,
    createFromKey(k: K): N,
    createForceNode(n: N, i: number, befores: readonly ForceNode<N, FDir>[]): ForceNode<N, FDir>,
  }): {
    nodes: readonly ForceNode<N, FDir>[]
    links: ForceLink<L, N, FDir>[]
  }
  (arg: {
    nodes: readonly ForceNode<N, FDir>[],
    fromNodes: ReadArray<N>,
    getNodeKey(n: N): K,
    createForceNode(n: N, i: number, befores: readonly ForceNode<N, FDir>[]): ForceNode<N, FDir>,
  }): {
    nodes: readonly ForceNode<N, FDir>[]
  }
}


export interface MergeNodesArg<N, K, FDir extends ForceDir = ForceDir> {
  nodes: readonly ForceNode<N, FDir>[],
  fromNodes: ReadArray<N>,
  createForceNode(n: N, i: number, befores: readonly ForceNode<N, FDir>[]): ForceNode<N, FDir>,
}
function _mergeNodes<N, K, FDir extends ForceDir = ForceDir>({
  nodes,
  fromNodes,
  createForceNode
}: MergeNodesArg<N, K, FDir>) {
  const helper = new ArrayHelper(nodes)
  const count = Math.max(nodes.length, fromNodes.length)
  for (let i = 0; i < count; i++) {
    //需要依fnode调顺序
    const fnode = fromNodes[i]
    const node = helper.get()[i]
    if (fnode) {
      const fkey = (fnode)
      if (node) {
        const key = (node.value)
        if (key == fkey) {
          if (node.index != i) {
            //坐标不相同
            helper.replace(i, {
              ...node,
              index: i
            })
          }
        } else {
          const targetIndex = helper.get().findIndex(v => (v.value) == fkey)
          if (targetIndex < 0) {
            //新的
            helper.insert(i,
              createForceNode(fnode, i, nodes)
            )
          } else {
            //旧的
            const targetRow = helper.get()[targetIndex]
            helper.removeAt(targetIndex)
            helper.insert(i, {
              ...targetRow,
              index: i
            })
          }
        }
      } else {
        helper.insert(i,
          createForceNode(fnode, i, nodes)
        )
      }
    } else {
      helper.removeAt(i)
    }
  }
  return helper
}
export function mergeNodes<N, K, FDir extends ForceDir = ForceDir>(arg: MergeNodesArg<N, K, FDir>) {
  return _mergeNodes(arg).get()
}
export interface MergeNodesAndLinksArg<N, L, K, FDir extends ForceDir = ForceDir> extends MergeNodesArg<N, K, FDir> {
  links: readonly ForceLink<L, N, FDir>[],
  fromLinks: ReadArray<L>,
  getNodeKey(n: N): K,
  getSorceKey(n: L): K,
  getTargetKey(n: L): K,
  createFromKey(k: K): N,
}
export function mergeNodesAndLinks<N, L, K, FDir extends ForceDir = ForceDir>(arg: MergeNodesAndLinksArg<N, L, K, FDir>) {
  const helper = _mergeNodes(arg)
  const {
    nodes,
    links,
    fromLinks,
    getNodeKey,
    getSorceKey,
    getTargetKey,
    createFromKey,
    createForceNode
  } = arg
  function getNode(key: K) {
    let value = helper.get().find(v => getNodeKey(v.value) == key)
    if (!value) {
      const index = helper.get().length
      value = createForceNode(createFromKey(key), index, nodes)
      helper.insert(index, value)
    }
    return value
  }
  const newLinks: ForceLink<L, N, FDir>[] = []
  for (let i = 0; i < fromLinks.length; i++) {
    const flink = fromLinks[i]
    newLinks.push({
      source: getNode(getSorceKey(flink)),
      target: getNode(getTargetKey(flink)),
      value: flink
    })
  }
  if (arrayEqual(newLinks, links, forceLinkEqual)) {
    return {
      nodes: helper.get(),
      links
    }
  }
  return {
    nodes: helper.get(),
    links: newLinks
  }
}
export function initToNode<T, FDir extends ForceDir>(
  node: T,
  nDim: DIMType,
  i: number,
  initForceNode: (d: number, v?: number, f?: number) => FDir,
  emptyDir: FDir
): ForceNode<T, FDir> {
  var radius = initialRadius * (nDim > 2 ? Math.cbrt(0.5 + i) : (nDim > 1 ? Math.sqrt(0.5 + i) : i)),
    rollAngle = i * initialAngleRoll,
    yawAngle = i * initialAngleYaw;
  if (nDim == 1) {
    return {
      index: i,
      value: node,
      x: initForceNode(radius),
      y: emptyDir,
      z: emptyDir
    }
  } else if (nDim == 2) {
    return {
      index: i,
      value: node,
      x: initForceNode(radius * Math.cos(rollAngle)),
      y: initForceNode(radius * Math.sin(rollAngle)),
      z: emptyDir
    }
  } else if (nDim == 3) {
    return {
      index: i,
      value: node,
      x: initForceNode(radius * Math.sin(rollAngle) * Math.cos(yawAngle)),
      y: initForceNode(radius * Math.cos(rollAngle)),
      z: initForceNode(radius * Math.sin(rollAngle) * Math.sin(yawAngle)),
    }
  } else {
    throw new Error("尚不支持")
  }
}
/**
 * 已经计算后的结果
 */
export type ForceLink<V, T, FDir extends ForceDir = ForceDir> = {
  source: ForceNode<T, FDir>
  target: ForceNode<T, FDir>
  value: V
}

function forceLinkEqual(a: ForceLink<any, any>, b: ForceLink<any, any>) {
  return a.source == b.source && a.target == b.target && a.value == b.value
}

/**
 * force可以diff去更新,有点类似hooks缓存上一步,即memo-reduce
 * 能用memo-reduce,在mve中怎么处理?
 */
export type ForceConfig = {
  //全局
  nDim: DIMType,
  //不影响
  alpha: number
  //不影响,拖拽
  alphaTarget: number
  //不影响
  alphaMin: number
  //不影响
  alphaDecay: number
  //不影响
  velocityDecay: number
}
export function initForceConfig(): ForceConfig {
  const alphaMin = 0.001
  const nDim = 2
  return {
    nDim,
    alphaTarget: 0,
    alpha: 1,
    alphaMin,
    alphaDecay: 1 - Math.pow(alphaMin, 1 / 300),
    velocityDecay: 0.6
  }
}

function addD(v: ForceDir, velocityDecay: number) {
  if (typeof v.f == 'number') {
    v.v = 0
    v.d = v.f
    return
  }
  v.v = v.v * velocityDecay
  v.d = v.d + v.v
}

let gnDim: DIMType = 2
let gVelocityDecay = 0
function joinNode(node: ForceNode<any>) {
  const velocityDecay = gVelocityDecay
  const nDim = gnDim
  addD(node.x, velocityDecay)
  if (nDim > 1) {
    addD(node.y, velocityDecay)
  }
  if (nDim > 2) {
    addD(node.z, velocityDecay)
  }
}
let cloneDir = quote
function cloneNode<T, FDir extends ForceDir>(node: ForceNode<T, FDir>, index: number): ForceNode<T, FDir> {
  return {
    index,
    x: cloneDir(node.x),
    y: cloneDir(node.y),
    z: cloneDir(node.z),
    value: node.value
  }
}
function simpleCloneLinks<T, V, FDir extends ForceDir>(links: readonly ForceLink<V, T, FDir>[], nodes: ForceNode<T, FDir>[]) {
  return links.map<ForceLink<V, T, FDir>>(link => {
    return {
      ...link,
      source: nodes[link.source.index],
      target: nodes[link.target.index]
    }
  })
}

export function cloneNodesAndLinks<T, V, FDir extends ForceDir = ForceDir>(
  _nodes: readonly ForceNode<V, FDir>[],
  _links: readonly ForceLink<T, V, FDir>[],
  _cloneDir: (v: FDir) => FDir
) {
  cloneDir = _cloneDir as any
  const nodes = _nodes.map(cloneNode)
  const links = simpleCloneLinks(_links, nodes)
  return {
    nodes,
    links
  }
}
/**
 * 重新调整
 * @param model 
 * @param copy 
 * @returns 
 */
export function tickForce<T, FDir extends ForceDir = ForceDir>(
  model: ForceConfig,
  nodes: readonly ForceNode<T, FDir>[],
  force: (alpha: number) => void,
) {
  let { alphaDecay, alphaTarget, alpha, nDim, velocityDecay } = model
  alpha += (alphaTarget - alpha) * alphaDecay;
  force(alpha)
  gnDim = nDim
  gVelocityDecay = velocityDecay
  nodes.forEach(joinNode)
  model.alpha = alpha
}

export function findNode<T, FDir extends ForceDir>(
  nodes: ForceNode<T, FDir>[],
  radius = Infinity,
  x = 0,
  y = 0,
  z = 0,
) {
  var i = 0,
    n = nodes.length,
    dx,
    dy,
    dz,
    d2,
    node,
    closest;

  radius *= radius;

  for (i = 0; i < n; ++i) {
    node = nodes[i];
    dx = x - node.x.d;
    dy = y - (node.y.d || 0);
    dz = z - (node.z.d || 0);
    d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < radius) closest = node, radius = d2;
  }
  return closest;
}