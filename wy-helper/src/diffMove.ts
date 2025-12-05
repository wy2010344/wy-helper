import { emptyArray, emptySet, ReadSet } from './util';

export type RenderChildrenOperante<Node> = {
  moveBefore(parent: Node, newChild: Node, beforeChild: Node | null): void;
  removeChild(parent: Node, child: Node): void;
  nextSibling(child: Node): Node | null;
  firstChild(child: Node): Node | null;
};
export interface DiffMoveFun<Node, F> {
  removeChild(parent: Node, child: Node): void;
  empty: F;
  clear(p: Node, n: F): void;
  move(pNode: Node, oldList: F, newList: F): void;
}
export function diffMove<Node>({
  moveBefore,
  removeChild,
  nextSibling,
  firstChild,
}: RenderChildrenOperante<Node>): DiffMoveFun<Node, readonly Node[]> {
  return {
    removeChild,
    empty: emptyArray,
    clear(p, n) {
      n.forEach(function (node) {
        removeChild(p, node);
      });
    },
    move(pNode, oldList, newList) {
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
    },
  };
}
export type RenderChildrenOperanteOrderLess<Node> = {
  removeChild(parent: Node, child: Node): void;
  appendChild(parent: Node, child: Node): void;
};

export function diffMoveOrderLess<Node>({
  removeChild,
  appendChild,
}: RenderChildrenOperanteOrderLess<Node>): DiffMoveFun<Node, ReadSet<Node>> {
  return {
    removeChild,
    empty: emptySet as Set<Node>,
    clear(p, n) {
      n.forEach(node => {
        removeChild(p, node);
      });
    },
    move(pNode, oldList, newList) {
      oldList.forEach(last => {
        if (!newList.has(last)) {
          removeChild(pNode, last);
        }
      });
      newList.forEach(last => {
        if (!oldList.has(last)) {
          appendChild(pNode, last);
        }
      });
    },
  };
}
