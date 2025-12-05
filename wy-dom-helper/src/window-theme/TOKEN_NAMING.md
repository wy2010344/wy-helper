# Design Token 命名规范

## 颜色 Token 命名

所有颜色相关的 token 都必须以 `color` 前缀开头，这是为了：

1. **命名空间隔离**: 避免与其他类型的 token 混淆
2. **一致性**: 所有颜色 token 遵循统一的命名模式
3. **可维护性**: 更容易识别和管理颜色相关的 token

## 正确的命名方式

### ✅ 正确
```typescript
tokens.colorPrimary
tokens.colorOnPrimary
tokens.colorSurface
tokens.colorOnSurface
tokens.colorSurfaceContainer
tokens.colorSurfaceContainerHigh
tokens.colorOutline
tokens.colorOutlineVariant
tokens.colorError
tokens.colorSuccess
tokens.colorWarning
```

### ❌ 错误
```typescript
tokens.primary          // 缺少 color 前缀
tokens.onPrimary        // 缺少 color 前缀
tokens.surface          // 缺少 color 前缀
tokens.outline          // 缺少 color 前缀
```

## 完整的颜色 Token 列表

### 主色系
- `colorPrimary` - 主色
- `colorOnPrimary` - 主色上的文字颜色
- `colorPrimaryContainer` - 主色容器
- `colorOnPrimaryContainer` - 主色容器上的文字颜色
- `colorPrimaryFixed` - 固定主色
- `colorOnPrimaryFixed` - 固定主色上的文字颜色
- `colorPrimaryFixedDim` - 暗淡的固定主色
- `colorOnPrimaryFixedVariant` - 固定主色变体上的文字颜色

### 次要色系
- `colorSecondary` - 次要色
- `colorOnSecondary` - 次要色上的文字颜色
- `colorSecondaryContainer` - 次要色容器
- `colorOnSecondaryContainer` - 次要色容器上的文字颜色
- `colorSecondaryFixed` - 固定次要色
- `colorOnSecondaryFixed` - 固定次要色上的文字颜色
- `colorSecondaryFixedDim` - 暗淡的固定次要色
- `colorOnSecondaryFixedVariant` - 固定次要色变体上的文字颜色

### 第三色系
- `colorTertiary` - 第三色
- `colorOnTertiary` - 第三色上的文字颜色
- `colorTertiaryContainer` - 第三色容器
- `colorOnTertiaryContainer` - 第三色容器上的文字颜色
- `colorTertiaryFixed` - 固定第三色
- `colorOnTertiaryFixed` - 固定第三色上的文字颜色
- `colorTertiaryFixedDim` - 暗淡的固定第三色
- `colorOnTertiaryFixedVariant` - 固定第三色变体上的文字颜色

### 错误色系
- `colorError` - 错误色
- `colorOnError` - 错误色上的文字颜色
- `colorErrorContainer` - 错误色容器
- `colorOnErrorContainer` - 错误色容器上的文字颜色

### 扩展颜色系统（非 Material Design 标准）

**重要说明**：以下颜色不是 Material Design 3.0 标准的一部分，`@material/material-color-utilities` 不会自动生成这些颜色。它们是为了常见的 UI 需求而添加的扩展颜色。

- `colorSuccess` - 成功色（默认：绿色 #10b981）
- `colorOnSuccess` - 成功色上的文字颜色
- `colorWarning` - 警告色（默认：橙色 #f59e0b）
- `colorOnWarning` - 警告色上的文字颜色

**使用建议**：
- 如果你使用 `@material/material-color-utilities` 动态生成主题，需要手动指定这些扩展颜色
- 或者可以考虑使用 Material Design 标准颜色：
  - Success → 使用 `colorTertiary`（通常是绿色调）
  - Warning → 使用 `colorSecondary` 或自定义颜色

### 表面色系
- `colorSurface` - 表面色
- `colorOnSurface` - 表面色上的文字颜色
- `colorSurfaceVariant` - 表面色变体
- `colorOnSurfaceVariant` - 表面色变体上的文字颜色
- `colorSurfaceContainer` - 表面容器色
- `colorSurfaceContainerLow` - 低层表面容器色
- `colorSurfaceContainerHigh` - 高层表面容器色
- `colorSurfaceContainerHighest` - 最高层表面容器色
- `colorSurfaceContainerLowest` - 最低层表面容器色
- `colorSurfaceDim` - 暗淡的表面色
- `colorSurfaceBright` - 明亮的表面色
- `colorSurfaceTint` - 表面色调

### 背景色系
- `colorBackground` - 背景色
- `colorOnBackground` - 背景色上的文字颜色

### 轮廓色系
- `colorOutline` - 轮廓色
- `colorOutlineVariant` - 轮廓色变体

### 反转色系
- `colorInverseSurface` - 反转表面色
- `colorInverseOnSurface` - 反转表面色上的文字颜色
- `colorInversePrimary` - 反转主色

### 其他
- `colorShadow` - 阴影色
- `colorScrim` - 遮罩色

## 非颜色 Token

非颜色 token 不需要特殊前缀：

### 间距
- `spaceXs`, `spaceSm`, `spaceMd`, `spaceLg`, `spaceXl`

### 圆角
- `radiusSm`, `radiusMd`, `radiusLg`, `radiusXl`

### 阴影
- `shadowSm`, `shadowMd`, `shadowLg`, `shadowXl`

### 动画
- `transitionFast`, `transitionNormal`, `transitionSlow`

## 使用示例

```typescript
import { createStyle } from '../util';

export const myComponent = createStyle(
  tokens => ({
    container: {
      base: {
        // ✅ 正确：使用 color 前缀
        background: tokens.colorSurface,
        color: tokens.colorOnSurface,
        border: `1px solid ${tokens.colorOutline}`,
        
        // ✅ 正确：非颜色 token 不需要前缀
        padding: tokens.spaceMd,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowMd,
        transition: tokens.transitionFast,
        
        '&:hover': {
          background: tokens.colorSurfaceContainerHigh,
          borderColor: tokens.colorPrimary,
        },
      },
    },
  }),
  {
    container: {},
  }
);
```

## 迁移指南

如果你的代码中使用了旧的命名方式（没有 `color` 前缀），需要进行以下替换：

```typescript
// 旧代码
background: tokens.primary
color: tokens.onSurface
border: `1px solid ${tokens.outline}`

// 新代码
background: tokens.colorPrimary
color: tokens.colorOnSurface
border: `1px solid ${tokens.colorOutline}`
```

可以使用正则表达式批量替换：
- `tokens\.primary` → `tokens.colorPrimary`
- `tokens\.surface` → `tokens.colorSurface`
- `tokens\.outline` → `tokens.colorOutline`
- 等等...

## 注意事项

1. **区分大小写**: token 名称是大小写敏感的
2. **驼峰命名**: 所有 token 使用驼峰命名法（camelCase）
3. **完整性**: 确保所有颜色 token 都有对应的 "on" 颜色（如 `colorPrimary` 对应 `colorOnPrimary`）
4. **一致性**: 在整个项目中保持命名一致性
