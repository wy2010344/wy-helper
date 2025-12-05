import {
  CreateStyle,
  StyleConfigMap,
  StyleVariantsMap,
} from '../cssObjectToString';

export interface DesignTokens {
  // Material Design 3.0 标准颜色系统
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
  
  // 扩展颜色（非 Material Design 标准，用于语义化场景）
  // 注意：这些颜色不会从 @material/material-color-utilities 自动生成
  // 需要手动指定或使用默认值
  colorSuccess: string;
  colorOnSuccess: string;
  colorWarning: string;
  colorOnWarning: string;
  spaceXs: string;
  spaceSm: string;
  spaceMd: string;
  spaceLg: string;
  spaceXl: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  transitionFast: string;
  transitionNormal: string;
  transitionSlow: string;
  colorPrimaryFixed: string;
  colorOnPrimaryFixed: string;
  colorPrimaryFixedDim: string;
  colorOnPrimaryFixedVariant: string;
  colorSecondaryFixed: string;
  colorOnSecondaryFixed: string;
  colorSecondaryFixedDim: string;
  colorOnSecondaryFixedVariant: string;
  colorTertiaryFixed: string;
  colorOnTertiaryFixed: string;
  colorTertiaryFixedDim: string;
  colorOnTertiaryFixedVariant: string;
  colorSurfaceDim: string;
  colorSurfaceBright: string;
  colorSurfaceContainerLowest: string;
  colorSurfaceTint: string;
  colorShadow: string;
  colorScrim: string;
  colorInverseSurface: string;
  colorInverseOnSurface: string;
  colorInversePrimary: string;
}

// 默认主题数据
export const defaultTokens: DesignTokens = {
  colorPrimary: '#006874',
  colorOnPrimary: '#ffffff',
  colorPrimaryContainer: '#97f0ff',
  colorOnPrimaryContainer: '#001f24',
  colorSecondary: '#4a6267',
  colorOnSecondary: '#ffffff',
  colorSecondaryContainer: '#cde7ec',
  colorOnSecondaryContainer: '#051f23',
  colorTertiary: '#525e7d',
  colorOnTertiary: '#ffffff',
  colorTertiaryContainer: '#dae2ff',
  colorOnTertiaryContainer: '#0e1b37',
  colorError: '#ba1a1a',
  colorOnError: '#ffffff',
  colorErrorContainer: '#ffdad6',
  colorOnErrorContainer: '#410002',
  // 扩展颜色（非 Material Design 标准）
  colorSuccess: '#10b981', // 绿色
  colorOnSuccess: '#ffffff',
  colorWarning: '#f59e0b', // 橙色
  colorOnWarning: '#ffffff',
  colorSurface: '#f8fafb',
  colorOnSurface: '#191c1d',
  colorSurfaceVariant: '#dbe4e6',
  colorOnSurfaceVariant: '#3f484a',
  colorSurfaceContainer: '#eef1f3',
  colorSurfaceContainerLow: '#f4f6f7',
  colorSurfaceContainerHigh: '#e8eaec',
  colorSurfaceContainerHighest: '#e2e4e6',
  colorBackground: '#f8fafb',
  colorOnBackground: '#191c1d',
  colorOutline: '#6f797a',
  colorOutlineVariant: '#bfc8ca',
  spaceXs: '4px',
  spaceSm: '8px',
  spaceMd: '16px',
  spaceLg: '24px',
  spaceXl: '32px',
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '14px',
  radiusXl: '18px',
  shadowSm:
    '0px 1px 3px 0px rgba(0, 0, 0, 0.08), 0px 1px 2px 0px rgba(0, 0, 0, 0.12)',
  shadowMd:
    '0px 2px 6px 0px rgba(0, 0, 0, 0.1), 0px 4px 8px 0px rgba(0, 0, 0, 0.08)',
  shadowLg:
    '0px 4px 12px 0px rgba(0, 0, 0, 0.12), 0px 8px 16px 0px rgba(0, 0, 0, 0.08)',
  shadowXl:
    '0px 8px 24px 0px rgba(0, 0, 0, 0.14), 0px 12px 32px 0px rgba(0, 0, 0, 0.1)',
  transitionFast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionNormal: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  transitionSlow: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  colorPrimaryFixed: '#97f0ff',
  colorOnPrimaryFixed: '#001f24',
  colorPrimaryFixedDim: '#4fd8eb',
  colorOnPrimaryFixedVariant: '#004f58',
  colorSecondaryFixed: '#cde7ec',
  colorOnSecondaryFixed: '#051f23',
  colorSecondaryFixedDim: '#b1cbd0',
  colorOnSecondaryFixedVariant: '#334b4f',
  colorTertiaryFixed: '#dae2ff',
  colorOnTertiaryFixed: '#0e1b37',
  colorTertiaryFixedDim: '#bac6ea',
  colorOnTertiaryFixedVariant: '#3b4664',
  colorSurfaceDim: '#d8dadb',
  colorSurfaceBright: '#ffffff',
  colorSurfaceContainerLowest: '#ffffff',
  colorSurfaceTint: '#006874',
  colorShadow: '#000000',
  colorScrim: '#000000',
  colorInverseSurface: '#2e3132',
  colorInverseOnSurface: '#eff1f1',
  colorInversePrimary: '#4fd8eb',
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
  config: (tokens: DesignTokens, append: (v: string) => void) => T,
  defaultStyle: StyleVariantsMap<T>
) {
  return new CreateStyle(config, defaultStyle);
}
