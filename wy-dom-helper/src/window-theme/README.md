# Window Theme System

基于 Material Design 3.0 的桌面窗口系统主题样式库。

## 设计理念

- **Material Design 3.0**: 遵循 Google Material Design 3.0 设计规范
- **动态主题**: 支持基于 `@material/material-color-utilities` 的动态颜色生成
- **类型安全**: 完整的 TypeScript 类型支持
- **可组合**: 使用 `createStyle` 创建可变体的组件样式
- **现代化**: 使用 CSS color-mix、backdrop-filter 等现代 CSS 特性

## 组件分类

### 基础组件
- **button**: 按钮组件，支持多种变体（primary, secondary, tertiary, success, warning, danger, ghost, outline）
- **input**: 输入框、文本域、选择框等表单元素
- **checkbox**: 复选框和单选框
- **card**: 卡片容器
- **formGroup**: 表单组

### 布局组件
- **layout**: 布局工具类（container, grid, flex）
- **divider**: 分割线
- **panel**: 面板容器（用于窗口内容区域）

### 窗口系统
- **window**: 窗口容器样式（标题栏、控制按钮、调整手柄）
- **scrollbar**: 自定义滚动条
- **statusBar**: 状态栏

### 导航组件
- **navigation**: 导航栏和导航项
- **menu**: 下拉菜单
- **dropdown**: 下拉容器

### 反馈组件
- **feedback**: 通知、徽章、提示框、进度条
- **modal**: 模态框
- **tooltip**: 提示框

### 高级组件
- **advanced**: 开关、标签、头像、评分、骨架屏
- **typeCard**: 类型卡片

### 展示组件
- **showcase**: 组件展示容器（用于 demo 页面）

### 全局样式
- **global**: 全局样式和重置样式

## 使用方式

### 1. 基础使用

```typescript
import { button } from 'wy-dom-helper/window-theme';
import { hookTheme } from './themeContext/util';

function MyComponent() {
  const getButtonCls = hookTheme(button);
  
  fdom.button({
    className: getButtonCls('button', {
      variant: 'primary',
      size: 'md',
    }),
    children: 'Click me',
  });
}
```

### 2. 主题定制

```typescript
import { defaultTokens, DesignTokens } from 'wy-dom-helper/window-theme';

const customTokens: DesignTokens = {
  ...defaultTokens,
  colorPrimary: '#3b82f6',
  colorOnPrimary: '#ffffff',
  // ... 其他 token
};
```

### 3. 动态主题切换

```typescript
import { hookRewriteTheme } from './themeContext/util';
import { themeFromSourceColor } from '@material/material-color-utilities';

hookRewriteTheme(oldTheme => {
  const theme = themeFromSourceColor(argbFromHex('#3b82f6'));
  // 生成新的 tokens
  return {
    ...oldTheme,
    tokens: newTokens,
  };
});
```

## Design Tokens

### 颜色系统

**Material Design 3.0 标准颜色**：
- Primary: 主色调
- Secondary: 次要色调
- Tertiary: 第三色调
- Error: 错误色
- Surface: 表面色
- Background: 背景色
- Outline: 边框色

**扩展颜色（非标准）**：
- Success: 成功色（需手动指定，不由 @material/material-color-utilities 生成）
- Warning: 警告色（需手动指定，不由 @material/material-color-utilities 生成）

### 间距系统
- spaceXs: 4px
- spaceSm: 8px
- spaceMd: 16px
- spaceLg: 24px
- spaceXl: 32px

### 圆角系统
- radiusSm: 6px
- radiusMd: 10px
- radiusLg: 14px
- radiusXl: 18px

### 阴影系统
- shadowSm: 轻微阴影
- shadowMd: 中等阴影
- shadowLg: 较大阴影
- shadowXl: 超大阴影

### 动画系统
- transitionFast: 0.15s
- transitionNormal: 0.25s
- transitionSlow: 0.4s

## 样式特性

### 1. 毛玻璃效果
窗口容器使用 `backdrop-filter: blur(20px)` 实现毛玻璃效果

### 2. 涟漪效果
按钮点击时有涟漪扩散动画

### 3. 平滑过渡
所有交互都有流畅的过渡动画

### 4. 响应式设计
支持不同尺寸的组件变体

### 5. 无障碍支持
- 键盘导航支持
- focus-visible 样式
- 语义化 HTML

## 最佳实践

1. **使用 hookTheme**: 始终通过 `hookTheme` 获取样式类名
2. **变体组合**: 合理使用变体组合创建不同状态的组件
3. **保持一致**: 在同一个项目中使用统一的设计 token
4. **性能优化**: 避免频繁切换主题，使用 CSS 变量优化性能
5. **可访问性**: 确保足够的颜色对比度和交互反馈

## 更新日志

### v1.0.0
- 初始版本
- 完整的 Material Design 3.0 组件库
- 支持动态主题切换
- 优化的窗口系统样式
