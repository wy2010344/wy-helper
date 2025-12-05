# 窗口主题系统更新日志

## 优化内容总结

### 1. 设计 Token 优化

**颜色调整**
- 优化了默认主题的表面色（Surface）系列，使用更柔和的灰色调
- 调整了背景色，从 `#fafdfd` 改为 `#f8fafb`，更加中性
- 优化了容器色的层级关系，使视觉层次更清晰

**圆角优化**
- 增大了圆角值，使界面更加圆润现代
  - radiusSm: 4px → 6px
  - radiusMd: 8px → 10px
  - radiusLg: 12px → 14px
  - radiusXl: 16px → 18px

**阴影优化**
- 使用更柔和的阴影效果，降低了阴影的不透明度
- 采用多层阴影叠加，营造更真实的深度感

**动画曲线优化**
- 统一使用 `cubic-bezier(0.4, 0, 0.2, 1)` 缓动函数
- 调整了动画时长，使交互更流畅
  - transitionFast: 0.15s
  - transitionNormal: 0.3s → 0.25s
  - transitionSlow: 0.5s → 0.4s

### 2. 组件样式优化

#### Button 按钮
- **涟漪效果**: 添加了点击涟漪动画（::before 伪元素）
- **新变体**: 增加了 `outline` 变体
- **交互优化**: 
  - hover 时有轻微上移和阴影增强
  - active 时回弹效果
  - 使用 `:not(:disabled)` 避免禁用状态的动画
- **视觉优化**: 移除了默认边框，使用纯色背景

#### Window 窗口
- **毛玻璃效果**: 增强了 backdrop-filter，从 `blur(8px)` 提升到 `blur(20px) saturate(180%)`
- **背景透明度**: 使用 `color-mix` 实现 95% 透明度的背景
- **标题栏**: 添加了渐变背景和 hover 效果
- **边框**: hover 时有双层边框效果

#### Input 输入框
- **三态样式**: 区分了 normal、hover、focus 三种状态
- **焦点环**: 使用更柔和的焦点环（15% 透明度）
- **背景层次**: 使用不同的 Surface 层级表示状态变化

#### Card 卡片
- **新变体**: 增加了 `filled` 变体
- **交互优化**: hoverable 卡片有更明显的提升效果
- **阴影优化**: 使用更轻的默认阴影

#### Navigation 导航
- **高度调整**: 从 48px 增加到 56px，更符合现代设计
- **激活指示**: 使用底部 2px 的彩色条代替边框
- **字体**: 增加了 fontWeight 500

#### Scrollbar 滚动条
- **现代化设计**: 使用透明轨道和半透明滚动条
- **新变体**: 增加了 `overlay` 变体（更透明的浮层滚动条）
- **Firefox 支持**: 添加了 `scrollbar-width` 和 `scrollbar-color`

### 3. 新增组件

#### Divider 分割线
- 支持水平/垂直方向
- 支持实线/虚线/点线样式
- 支持带文字的分割线

#### Tooltip 提示框
- 支持四个方向（top, bottom, left, right）
- 自动生成箭头指示
- 支持浅色和深色两种变体

#### Modal 模态框
- 完整的进入/退出动画
- 毛玻璃背景遮罩
- 多种尺寸选项（sm, md, lg, xl, full）
- 标准的 header/body/footer 结构

#### Menu 菜单
- 滑入动画
- 支持分组和分割线
- 支持快捷键显示
- 支持禁用和危险状态

#### Dropdown 下拉容器
- 支持四个方向定位
- 轻量级的下拉容器组件

#### Checkbox & Radio 选择框
- 自定义样式的复选框和单选框
- 支持半选状态（indeterminate）
- 平滑的选中动画

#### Panel 面板
- 窗口内容区域的标准容器
- 支持 header/body/footer 结构
- 支持分段（section）布局

#### Showcase 展示容器
- 专门用于组件演示的容器样式
- 统一的标题、描述、代码块样式
- 网格布局支持

#### Global 全局样式
- 字体和排版重置
- 辅助类（truncate, line-clamp, sr-only）
- 统一的盒模型

### 4. 辅助工具

#### showcase-layout.ts
创建了一套 Showcase 布局辅助组件：
- `ShowcaseContainer`: 容器
- `ShowcaseSection`: 区块
- `ShowcaseDemo`: 演示区域
- `ShowcaseDescription`: 描述文本
- `ShowcaseDivider`: 分割线
- `ShowcaseGrid`: 网格布局
- `ShowcaseLabel`: 标签
- `ShowcaseCode`: 代码块

### 5. 文档完善

- 创建了 `README.md` 详细说明使用方式
- 创建了 `CHANGELOG.md` 记录更新内容
- 优化了代码注释

## 设计原则

1. **一致性**: 所有组件遵循统一的设计语言
2. **现代化**: 使用最新的 CSS 特性（color-mix, backdrop-filter）
3. **流畅性**: 所有交互都有平滑的过渡动画
4. **层次感**: 通过阴影、透明度、模糊营造深度
5. **可访问性**: 支持键盘导航和屏幕阅读器
6. **性能**: 使用 CSS 变量和 GPU 加速

## 视觉特点

- **毛玻璃效果**: 窗口和模态框使用毛玻璃背景
- **柔和阴影**: 多层次的柔和阴影系统
- **圆润设计**: 更大的圆角值
- **微交互**: 丰富的 hover、active 状态反馈
- **色彩层次**: 清晰的 Surface 层级系统

## 兼容性

- 现代浏览器（Chrome 88+, Firefox 94+, Safari 15.4+, Edge 88+）
- 使用了 CSS color-mix（需要较新的浏览器）
- 使用了 backdrop-filter（需要浏览器支持）

## 下一步计划

- [ ] 添加更多组件（Tabs, Accordion, Drawer 等）
- [ ] 支持暗色主题
- [ ] 添加动画预设库
- [ ] 性能优化（CSS 变量缓存）
- [ ] 添加更多 showcase 示例
