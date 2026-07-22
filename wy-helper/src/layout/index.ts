import { Layout, LayoutError, LayoutFun } from './layout';

export * from './stack';
export * from './flex';
export * from './layout';

export const absoluteLayoutObject: Layout = {
  sizeFromChildren() {
    throw new LayoutError('没有默认值');
  },
  childPosition(i) {
    return 0;
  },
  childSize(i) {
    throw new LayoutError('没有子节点的尺寸');
  },
  allowSizeFromChildren() {
    return false;
  },
};

export const absoluteLayoutFun: LayoutFun<any> = {
  createLayout(o) {
    return absoluteLayoutObject;
  },
};
