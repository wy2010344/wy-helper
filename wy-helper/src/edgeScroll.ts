import { Axis } from '.';

export type EdgeScrollPureCfg = {
  padding: number;
};
export type EdgeScrollAxis = EdgeScrollPureCfg | boolean;

export type EdgeScrollBox =
  | {
      min?: EdgeScrollAxis;
      max?: EdgeScrollAxis;
    }
  | boolean;

function getCfg(
  padding: number,
  dir: 'min' | 'max',
  M?: EdgeScrollBox
): EdgeScrollPureCfg | void {
  if (M == true) {
    return {
      padding,
    };
  }
  if (typeof M == 'object' && M[dir]) {
    const MDir = M[dir];
    if (MDir == true) {
      return {
        padding,
      };
    }
    if (typeof MDir == 'object') {
      return {
        padding: MDir.padding,
      };
    }
  }
}

export type EdgeScrollConfig = {
  padding?: number;
  config?: EdgeScrollBox;
};
export function edgeScrollChange(
  axis: Axis,
  config: EdgeScrollConfig,
  set: (diff: number) => void
) {
  const padding = config.padding || 0;
  const yMin = getCfg(padding, 'min', config.config);
  const yMax = getCfg(padding, 'max', config.config);
  return function (cp: number) {
    if (yMin) {
      const diffTop = axis.min + yMin.padding - cp;
      if (diffTop > 0) {
        set(-diffTop);
      }
    }
    if (yMax) {
      const diffBottom = axis.max - yMax.padding - cp;
      if (diffBottom < 0) {
        set(-diffBottom);
      }
    }
  };
}
