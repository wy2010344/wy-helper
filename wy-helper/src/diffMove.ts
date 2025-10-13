export type RenderChildrenOperante<Node> = {
  moveBefore(parent: Node, newChild: Node, beforeChild: Node | null): void;
  removeChild(parent: Node, child: Node): void;
  nextSibling(child: Node): Node | null;
  firstChild(child: Node): Node | null;
  // lastChild(child: Node): Node | null
  // children(): Node[]
};
export function diffMove<Node>(
  {
    moveBefore,
    removeChild,
    nextSibling,
    firstChild,
  }: RenderChildrenOperante<Node>,
  pNode: Node,
  oldList: readonly Node[],
  newList: readonly Node[]
) {
  //先删除
  oldList.forEach(last => {
    if (!newList.includes(last)) {
      removeChild(pNode, last);
    }
  });
  let beforeNode: Node | null = firstChild(pNode);
  while (beforeNode && !newList.includes(beforeNode)) {
    beforeNode = nextSibling(beforeNode);
  }
  //再增加
  for (let i = 0; i < newList.length; i++) {
    const newChild = newList[i];
    if (newChild != beforeNode) {
      moveBefore(pNode, newChild, beforeNode);
    } else {
      //beforeNode可能不在newList里,需要找到newList上的节点
      while (beforeNode && !newList.includes(beforeNode, i + 1)) {
        beforeNode = nextSibling(beforeNode);
      }
    }
  }
}
