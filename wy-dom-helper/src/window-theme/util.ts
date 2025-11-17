import {
  CreateStyle,
  StyleConfigMap,
  StyleVariantsMap,
} from '../cssObjectToString';

export interface DesignTokens {
  // 颜色系统
  colorPrimary: string;
  colorOnPrimary: string;
  colorPrimaryContainer: string;
  colorOnPrimaryContainer: string;

  colorSecondary: string;
  colorOnSecondary: string;
  colorSecondaryContainer: string;
  colorOnSecondaryContainer: string;

  colorTertiary: string;
  colorOnTertiary: string;
  colorTertiaryContainer: string;
  colorOnTertiaryContainer: string;

  colorError: string;
  colorOnError: string;
  colorErrorContainer: string;
  colorOnErrorContainer: string;

  colorSurface: string;
  colorOnSurface: string;
  colorSurfaceVariant: string;
  colorOnSurfaceVariant: string;
  colorSurfaceContainer: string;
  colorSurfaceContainerLow: string;
  colorSurfaceContainerHigh: string;
  colorSurfaceContainerHighest: string;

  colorBackground: string;
  colorOnBackground: string;

  colorOutline: string;
  colorOutlineVariant: string;

  // 间距系统
  spaceXs: string;
  spaceSm: string;
  spaceMd: string;
  spaceLg: string;
  spaceXl: string;

  // 圆角系统
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;

  // 阴影系统
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;

  // 动画系统
  transitionFast: string;
  transitionNormal: string;
  transitionSlow: string;

  // 语义化别名
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  tertiary: string;
  onTertiary: string;
  error: string;
  onError: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  surface: string;
  onSurface: string;
  outline: string;
  outlineVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
}

// 默认主题数据
export const defaultTokens: DesignTokens = {
  // 颜色系统
  colorPrimary: 'rgb(208, 188, 254)',
  colorOnPrimary: 'rgb(56, 30, 114)',
  colorPrimaryContainer: 'rgb(79, 55, 139)',
  colorOnPrimaryContainer: 'rgb(234, 221, 255)',

  colorSecondary: 'rgb(204, 194, 220)',
  colorOnSecondary: 'rgb(51, 45, 65)',
  colorSecondaryContainer: 'rgb(74, 68, 88)',
  colorOnSecondaryContainer: 'rgb(232, 222, 248)',

  colorTertiary: 'rgb(239, 184, 200)',
  colorOnTertiary: 'rgb(73, 37, 50)',
  colorTertiaryContainer: 'rgb(99, 59, 72)',
  colorOnTertiaryContainer: 'rgb(255, 216, 228)',

  colorError: 'rgb(242, 184, 181)',
  colorOnError: 'rgb(105, 0, 5)',
  colorErrorContainer: 'rgb(147, 0, 10)',
  colorOnErrorContainer: 'rgb(255, 218, 214)',

  colorSurface: 'rgb(16, 14, 19)',
  colorOnSurface: 'rgb(230, 224, 233)',
  colorSurfaceVariant: 'rgb(73, 69, 78)',
  colorOnSurfaceVariant: 'rgb(202, 196, 208)',
  colorSurfaceContainer: 'rgb(29, 27, 32)',
  colorSurfaceContainerLow: 'rgb(24, 22, 27)',
  colorSurfaceContainerHigh: 'rgb(39, 37, 42)',
  colorSurfaceContainerHighest: 'rgb(50, 47, 53)',

  colorBackground: 'rgb(16, 14, 19)',
  colorOnBackground: 'rgb(230, 224, 233)',

  colorOutline: 'rgb(148, 142, 153)',
  colorOutlineVariant: 'rgb(73, 69, 78)',

  // 间距系统
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '16px',
  spaceLg: '24px',
  spaceXl: '32px',

  // 圆角系统
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',

  // 阴影系统
  shadowSm:
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
  shadowMd:
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
  shadowLg:
    '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
  shadowXl:
    '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',

  // 动画系统
  transitionFast: '0.15s cubic-bezier(0.2, 0, 0, 1)',
  transitionNormal: '0.3s cubic-bezier(0.2, 0, 0, 1)',
  transitionSlow: '0.5s cubic-bezier(0.2, 0, 0, 1)',

  // 语义化别名
  primary: 'rgb(208, 188, 254)',
  onPrimary: 'rgb(56, 30, 114)',
  secondary: 'rgb(204, 194, 220)',
  onSecondary: 'rgb(51, 45, 65)',
  tertiary: 'rgb(239, 184, 200)',
  onTertiary: 'rgb(73, 37, 50)',
  error: 'rgb(242, 184, 181)',
  onError: 'rgb(105, 0, 5)',
  success: 'rgb(239, 184, 200)', // 使用 tertiary 作为 success
  onSuccess: 'rgb(73, 37, 50)',
  warning: 'rgb(204, 194, 220)', // 使用 secondary 作为 warning
  onWarning: 'rgb(51, 45, 65)',
  surface: 'rgb(16, 14, 19)',
  onSurface: 'rgb(230, 224, 233)',
  outline: 'rgb(148, 142, 153)',
  outlineVariant: 'rgb(73, 69, 78)',
  surfaceContainer: 'rgb(29, 27, 32)',
  surfaceContainerHigh: 'rgb(39, 37, 42)',
  surfaceContainerHighest: 'rgb(50, 47, 53)',
  surfaceContainerLow: 'rgb(0,0,0)',
};
export type ThemeData = {
  /**前缀*/
  prefix: string;
  tokens: DesignTokens;
};
/**
 * 未来应该像cva,但cva目前是tailwindcss,这里要动态生成script标签
 * @param className
 * @param fun
 * @returns
 */
export function createStyle<T extends StyleConfigMap>(
  config: (tokens: DesignTokens) => T,
  defaultStyle: StyleVariantsMap<T>
) {
  return new CreateStyle(config, defaultStyle);
}
