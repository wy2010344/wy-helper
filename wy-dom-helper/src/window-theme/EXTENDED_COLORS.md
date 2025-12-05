# 扩展颜色说明

## 为什么有扩展颜色？

Material Design 3.0 规范中只定义了 **Error** 作为语义化颜色，并没有 Success 和 Warning。但在实际的 UI 开发中，我们经常需要这些语义化颜色来表示不同的状态。

因此，我们在 DesignTokens 中添加了 `colorSuccess` 和 `colorWarning` 作为**扩展颜色**。

## 重要提示

⚠️ **这些扩展颜色不会从 `@material/material-color-utilities` 自动生成！**

当你使用 `themeFromSourceColor()` 生成主题时，它只会生成 Material Design 标准的颜色角色，不包括 success 和 warning。

## 使用方式

### 方案 1：手动指定扩展颜色（推荐）

```typescript
import { themeFromSourceColor, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { defaultTokens } from 'wy-dom-helper/window-theme';

// 生成 Material Design 主题
const theme = themeFromSourceColor(argbFromHex('#006874'));
const scheme = theme.schemes.light;

// 合并标准颜色和扩展颜色
const tokens = {
  ...defaultTokens,
  // Material Design 标准颜色
  colorPrimary: hexFromArgb(scheme.primary),
  colorOnPrimary: hexFromArgb(scheme.onPrimary),
  // ... 其他标准颜色
  
  // 手动指定扩展颜色
  colorSuccess: '#10b981', // 绿色
  colorOnSuccess: '#ffffff',
  colorWarning: '#f59e0b', // 橙色
  colorOnWarning: '#ffffff',
};
```

### 方案 2：使用 Material Design 标准颜色映射

如果你想完全遵循 Material Design 规范，可以将语义化颜色映射到标准颜色：

```typescript
const tokens = {
  ...materialDesignTokens,
  
  // 将 success 映射到 tertiary（通常是绿色调）
  colorSuccess: tokens.colorTertiary,
  colorOnSuccess: tokens.colorOnTertiary,
  
  // 将 warning 映射到 secondary 或使用 error 的变体
  colorWarning: tokens.colorSecondary,
  colorOnWarning: tokens.colorOnSecondary,
};
```

### 方案 3：从 Tertiary 生成 Success 颜色

Material Design 的 Tertiary 通常是绿色调，可以用作 Success 颜色：

```typescript
import { themeFromSourceColor, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// 使用绿色作为源颜色生成一个独立的主题
const successTheme = themeFromSourceColor(argbFromHex('#10b981'));
const successScheme = successTheme.schemes.light;

const tokens = {
  ...mainTokens,
  colorSuccess: hexFromArgb(successScheme.primary),
  colorOnSuccess: hexFromArgb(successScheme.onPrimary),
};
```

## 默认值

如果你不使用 `@material/material-color-utilities`，可以直接使用我们提供的默认值：

```typescript
import { defaultTokens } from 'wy-dom-helper/window-theme';

// defaultTokens 已经包含了扩展颜色的默认值
// colorSuccess: '#10b981' (绿色)
// colorOnSuccess: '#ffffff'
// colorWarning: '#f59e0b' (橙色)
// colorOnWarning: '#ffffff'
```

## 组件使用

所有使用扩展颜色的组件：

- **Button**: `variant="success"`, `variant="warning"`
- **Badge**: `variant="success"`, `variant="warning"`
- **Alert**: `variant="success"`, `variant="warning"`
- **Progress**: `variant="success"`, `variant="warning"`
- **Tag**: `variant="success"`, `variant="warning"`
- **StatusBar**: `variant="success"`, `variant="warning"`
- **Notification**: `variant="success"`, `variant="warning"`

## 最佳实践

1. **保持一致性**：在整个应用中使用相同的 success 和 warning 颜色
2. **考虑无障碍**：确保颜色对比度符合 WCAG 标准
3. **文档化**：在团队中明确说明这些是扩展颜色，不是 Material Design 标准
4. **可选方案**：如果想完全遵循 Material Design，考虑只使用 Error，不使用 Success 和 Warning

## 示例：完整的主题生成

```typescript
import {
  themeFromSourceColor,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { DesignTokens } from 'wy-dom-helper/window-theme';

function generateTheme(sourceColor: string, isDark: boolean): DesignTokens {
  const theme = themeFromSourceColor(argbFromHex(sourceColor));
  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

  return {
    // Material Design 标准颜色（自动生成）
    colorPrimary: hexFromArgb(scheme.primary),
    colorOnPrimary: hexFromArgb(scheme.onPrimary),
    colorPrimaryContainer: hexFromArgb(scheme.primaryContainer),
    colorOnPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    // ... 其他标准颜色
    
    // 扩展颜色（手动指定）
    colorSuccess: '#10b981',
    colorOnSuccess: '#ffffff',
    colorWarning: '#f59e0b',
    colorOnWarning: '#ffffff',
    
    // 非颜色 tokens
    spaceXs: '4px',
    spaceSm: '8px',
    // ...
  };
}
```

## 总结

- ✅ Success 和 Warning 是**扩展颜色**，方便日常开发
- ⚠️ 它们**不是** Material Design 3.0 标准的一部分
- 🔧 使用 `@material/material-color-utilities` 时需要**手动指定**这些颜色
- 📖 在团队中**明确文档化**这一点，避免混淆
