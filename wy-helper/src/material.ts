export type KScheme = 'dark' | 'light';

//schemes[scheme]
/**
Fixed 系列 → 让品牌色更稳定、适合按钮容器、状态色。
Surface Container 系列 → 提供多层次背景，代替阴影塑造层次。
Surface Tint → elevation overlay 用的品牌染色。


primary-fixed	按钮容器、FAB、主要突出的 UI 区域
on-primary-fixed	按钮文字、FAB 图标
primary-fixed-dim	按钮 hover/pressed 态、禁用态
on-primary-fixed-variant	次要文本、inactive 图标
surface-dim	应用大背景、底部背景
surface-bright	顶部 AppBar、顶层工具栏
surface-container-low	卡片背景（低层级）
surface-container	主对话框背景
surface-container-high	侧边栏、浮动面板
surface-container-highest	顶级模态对话框
surface-tint	卡片 elevation overlay，提升 UI 品牌感
 */
type TonalPalette = {
  tone(n: number): number;
};
export function extendMaterialScheme(
  theme: {
    palettes: {
      primary: TonalPalette;
      secondary: TonalPalette;
      tertiary: TonalPalette;
      neutral: TonalPalette;
    };
  },
  scheme: KScheme,
  contrastLevel: 0 | 1 | 2 = 0
) {
  const palettes = theme.palettes;
  const isDark = scheme == 'dark';
  // 对比度偏移量
  const shift = contrastLevel === 1 ? 5 : contrastLevel === 2 ? 10 : 0;

  return {
    // primary fixed
    primaryFixed: palettes.primary.tone(
      (isDark ? 80 : 90) + (isDark ? -shift : shift)
    ),
    onPrimaryFixed: palettes.primary.tone(
      (isDark ? 20 : 10) + (isDark ? shift : -shift)
    ),
    primaryFixedDim: palettes.primary.tone(
      (isDark ? 60 : 80) + (isDark ? -shift : shift)
    ),
    onPrimaryFixedVariant: palettes.primary.tone(
      30 + (isDark ? shift : -shift)
    ),
    // secondary fixed
    secondaryFixed: palettes.secondary.tone(
      (isDark ? 80 : 90) + (isDark ? -shift : shift)
    ),
    onSecondaryFixed: palettes.secondary.tone(
      (isDark ? 20 : 10) + (isDark ? shift : -shift)
    ),
    secondaryFixedDim: palettes.secondary.tone(
      (isDark ? 60 : 80) + (isDark ? -shift : shift)
    ),
    onSecondaryFixedVariant: palettes.secondary.tone(
      30 + (isDark ? shift : -shift)
    ),
    // tertiary fixed
    tertiaryFixed: palettes.tertiary.tone(
      (isDark ? 80 : 90) + (isDark ? -shift : shift)
    ),
    onTertiaryFixed: palettes.tertiary.tone(
      (isDark ? 20 : 10) + (isDark ? shift : -shift)
    ),
    tertiaryFixedDim: palettes.tertiary.tone(
      (isDark ? 60 : 80) + (isDark ? -shift : shift)
    ),
    onTertiaryFixedVariant: palettes.tertiary.tone(
      30 + (isDark ? shift : -shift)
    ),
    surfaceDim: palettes.neutral.tone(
      (isDark ? 6 : 87) + (isDark ? -shift : shift)
    ),
    surfaceBright: palettes.neutral.tone(
      (isDark ? 24 : 98) + (isDark ? -shift : shift)
    ),
    surfaceContainerLowest: palettes.neutral.tone(
      (isDark ? 4 : 100) + (isDark ? -shift : shift)
    ),
    surfaceContainerLow: palettes.neutral.tone(
      (isDark ? 10 : 96) + (isDark ? -shift : shift)
    ),
    surfaceContainer: palettes.neutral.tone(
      (isDark ? 12 : 94) + (isDark ? -shift : shift)
    ),
    surfaceContainerHigh: palettes.neutral.tone(
      (isDark ? 17 : 92) + (isDark ? -shift : shift)
    ),
    surfaceContainerHighest: palettes.neutral.tone(
      (isDark ? 22 : 90) + (isDark ? -shift : shift)
    ),
    surfaceTint: palettes.primary.tone(
      (isDark ? 80 : 40) + (isDark ? -shift : shift)
    ),
  };
}
