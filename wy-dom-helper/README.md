# wy-dom-helper

直接操作 DOM 的工具库，为 `mve-dom` 提供属性更新、事件、SVG、尺寸监听等基础能力。

## 安装

```bash
npm install wy-dom-helper wy-helper
```

## 属性更新

扁平属性更新器（`mve-dom` 的 `fdom` / `fsvg` 底层）：

- `renderFDomAttr` / `renderFSvgAttr` - 一次性写入属性
- `mergeFDomAttr` / `mergeFSvgAttr` - 按帧合并更新
- `renderMDomAttr` / `renderGDomAttr` - `zdom` / `gdom` 使用的收敛更新
- `mergeXDomAttr` / `mergeXSvgAttr` - XML 破折线风格

属性命名映射：

| 写法 | 对应 |
| --- | --- |
| `s_xxx` | `style.xxx` |
| `css_xxx` | CSS 变量 `--xxx` |
| `data_xxx` | `data-xxx` |
| `aria_xxx` | `aria-xxx` |

底层更新函数也可单独使用：`addEvent`、`isEvent`、`mergeEvent`、`updateDom`、`updateSvg`、`updateAttr`、`updateStyle`、`updateDataSet`、`updateCssVariable`、`setText`、`setHtml`。

## 文本与 HTML 子节点

```ts
import { toGetHtml, toGetText, toHtml, toText } from 'wy-dom-helper'

const label = toText`count = ${count.get}`   // 静态拼接 + 动态信号
const getLabel = toGetText(() => `${count.get()}`)
const html = toHtml`<b>${count.get}</b>`
const getHtml = toGetHtml(() => `<b>${count.get()}</b>`)
```

`toText` / `toHtml` 返回可直接作为 `children` 的值；`toGetText` / `toGetHtml` 返回 getter。

## 窗口与设备

不依赖模块顶层 `window`，Node / SSR 下可安全导入；监听器在首次读取时惰性注册。

```ts
import { devicePixelRatio, windowSize } from 'wy-dom-helper'

windowSize.width()
windowSize.height()

devicePixelRatio.get()
devicePixelRatio.set(2)
```

## 工具函数

- `cns(...classes)` - 条件类名拼接
- `createScript` / `createStyle` / `createLink` - 动态注入资源
- `chooseFileThen` / `readFileAs` - 文件选择与读取
- `observerIntersection` / `observerResize` - Intersection / Resize 观察器
- `requestBatchAnimationFrame` / `debounceRequestBatchAnimationFrame` - 合并动画帧
- `subscribeEventListener` - 可取消的事件订阅
- `getPageOffset` / `getCommonParentNode` / `splitClassNames` / `stringifyStyle`
- `delayAnimationFrame` - 等待下一帧

## 其它模块

- `stylis` - CSS 预处理
- `cssAnimationHelper` / `animation` - CSS 动画
- `indexedDBHelper` - IndexedDB 封装
- `loadImage` / `balanceSize` - 图片加载与尺寸平衡
- `reorder` / `dragMove` / `onMove` / `moveEdgeScroll` - 拖拽与边缘滚动
- `highlightHelper` / `prismHelper` - 代码高亮
- `input` - 输入处理

## 子路径

### `wy-dom-helper/contentEditable`

contenteditable 的选区、文本模型与输入处理。

### `wy-dom-helper/canvas`

Canvas 与 Path2D 相关工具。

### `wy-dom-helper/window-theme`

主题 token 与组件样式生成，供 `daisy-mobile-helper` 使用：

```ts
import { button, card } from 'wy-dom-helper/window-theme'
```

## License

MIT
