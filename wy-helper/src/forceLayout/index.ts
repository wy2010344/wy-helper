import { createSignal, storeRef, StoreRef } from "wy-helper"

export type TreeNode<T> = {
  x: number
  y: number
  z: number
  r: number
  value: number
  data: T
  next: TreeNode<T>
} & Array<TreeNode<T>>

export type CallBackNode<T, F> = (node: ForceNode<T>, i: number, nodes: ForceNode<T>[]) => F

/**
 * 使用get/set来处理
 */
export type ForceDir = {
  /**速度 */
  v: number
  readonly vSignal: StoreRef<number>
  /**位移 */
  d: number
  readonly dSignal: StoreRef<number>
  /**固定位置 */
  f?: number
  readonly fSignal: StoreRef<number | undefined>
}

export type Direction = "x" | "y" | "z"

export type ForceNode<T> = {
  index: number
  x: ForceDir
  y: ForceDir
  z: ForceDir
  value: T
}

const emptySignal = storeRef(0)
const emptyDir: ForceDir = {
  d: 0,
  dSignal: emptySignal,
  v: 0,
  vSignal: emptySignal,
  fSignal: storeRef(undefined)
}
export type DIMType = 1 | 2 | 3
const initialRadius = 10,
  initialAngleRoll = Math.PI * (3 - Math.sqrt(5)), // Golden ratio angle
  initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221)); // Markov irrational number


function initForceNode(d: number, v: number = 0, f?: number): ForceDir {
  return new ForceDirImpl(d, v, f)
}
class ForceDirImpl implements ForceDir {
  readonly dSignal: StoreRef<number>
  readonly vSignal: StoreRef<number>
  readonly fSignal: StoreRef<number | undefined>
  constructor(
    d: number,
    v: number,
    f?: number
  ) {
    this.dSignal = createSignal(d)
    this.vSignal = createSignal(v)
    this.fSignal = createSignal(f)
  }

  get d() {
    return this.dSignal.get()
  }
  set d(v) {
    this.dSignal.set(v)
  }
  get v() {
    return this.vSignal.get()
  }
  set v(v) {
    this.vSignal.set(v)
  }
  get f() {
    return this.fSignal.get()
  }
  set f(v) {
    this.fSignal.set(v)
  }
}

export function initToNode<T>(node: T, nDim: DIMType, i: number): ForceNode<T> {
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
export function initToForceNode<T>(nodes: T[], nDim: DIMType): ForceNode<T>[] {
  return nodes.map((node, i) => {
    return initToNode(node, nDim, i)
  })
}



/**
 * 已经计算后的结果
 */
export type ForceLink<V, T> = {
  source: ForceNode<T>
  target: ForceNode<T>
  value: V
}


export type NodeForce<T, V> = (
  nodes: Readonly<ForceNode<T>>[],
  nDim: DIMType,
  links: ForceLink<V, T>[],
) => NodeForceFun<T, V>
export type NodeForceFun<T, V> = (alpha: number, nodes: ForceNode<T>[], links: ForceLink<V, T>[]) => void


export type BaseForceModel<T, V> = {
  //全局
  nDim: DIMType,
  //全局
  forces: Record<string, NodeForce<T, V>>
  nodes: ForceNode<T>[]
  links: ForceLink<V, T>[],
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
export type ForceModel<T, V> = BaseForceModel<T, V> & {
  //tick时触发
  fs: NodeForceFun<T, V>[]
}

export function initForceModel<T, V>(
  nodes: ForceNode<T>[],
  links: ForceLink<V, T>[],
  forces: Record<string, NodeForce<T, V>>
): ForceModel<T, V> {
  const alphaMin = 0.001
  const nDim = 2
  const fs = Object.values(forces).map(f => f(nodes, nDim, links))
  return {
    nDim,
    alphaTarget: 0,
    alpha: 1,
    alphaMin,
    alphaDecay: 1 - Math.pow(alphaMin, 1 / 300),
    velocityDecay: 0.6,
    forces,
    nodes,
    links,
    fs
  }
}
export function updateForceConfig<T, V>(
  model: ForceModel<T, V>,
  config: Partial<BaseForceModel<T, V>>
) {
  const changeAll = config.nDim != model.nDim
    || config.nodes
    || config.links
    || config.forces

  model = {
    ...model,
    ...config
  }
  if (changeAll) {
    model.fs = Object.values(model.forces).map(f => f(model.nodes, model.nDim, model.links))
  }
  return model
}

/**
 * 重新调整
 * @param model 
 * @param copy 
 * @returns 
 */
export function tickForce<T, V>(
  model: ForceModel<T, V>,
  copy?: boolean
) {
  let { nodes, links, alphaDecay, alphaTarget, alpha, fs, nDim, velocityDecay } = model
  if (copy) {
    nodes = nodes.map(cloneNode)
    links = simpleCloneLinks(links, nodes)
  }
  // console.log("vs", nodes)
  alpha += (alphaTarget - alpha) * alphaDecay;
  fs.forEach((force) => {
    force(alpha, nodes, links);
  });
  function addD(v: ForceDir) {
    if (typeof v.f == 'number') {
      v.v = 0
      v.d = v.f
      return
    }
    v.v = v.v * velocityDecay
    v.d = v.d + v.v
  }
  function joinNode(node: ForceNode<any>) {
    addD(node.x)
    if (nDim > 1) {
      addD(node.y)
    }
    if (nDim > 2) {
      addD(node.z)
    }
  }
  nodes.forEach(joinNode)
  if (copy) {
    return {
      ...model,
      nodes,
      links,
      alpha
    }
  }
  model.alpha = alpha
  return model
}

function cloneDir(d: ForceDir) {
  return {
    ...d
  }
}

function cloneNode<T>(node: ForceNode<T>, index: number): ForceNode<T> {
  return {
    index,
    x: cloneDir(node.x),
    y: cloneDir(node.y),
    z: cloneDir(node.z),
    value: node.value
  }
}

export function simpleCloneLinks<T, V>(links: ForceLink<V, T>[], nodes: ForceNode<T>[]) {
  return links.map<ForceLink<V, T>>(link => {
    return {
      ...link,
      source: nodes[link.source.index],
      target: nodes[link.target.index]
    }
  })
}

export function findNode(
  nodes: ForceNode<any>[],
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