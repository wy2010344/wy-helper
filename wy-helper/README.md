# wy-helper

MVE 的底层工具库：响应式 Signal、调度器、状态容器，以及 Promise、动画、几何、日期等通用工具。

## 安装

```bash
npm install wy-helper
```

## 响应式

```ts
import {
  addEffect,
  batchSignalEnd,
  createLateSignal,
  createSignal,
  memo,
  trackSignal,
} from 'wy-helper'

const count = createSignal(0)

// memo 的回调参数：(上一次的值, 是否已初始化)
const double = memo(() => count.get() * 2)

// 建立依赖追踪，返回值用于解除追踪
const dispose = trackSignal(double, value => {
  console.log('double =', value)
})

count.set(1)
batchSignalEnd() // 立即冲刷当前批次

addEffect(() => {
  console.log('本批更新完成')
})

dispose()
```

| API | 说明 |
| --- | --- |
| `createSignal(value, shouldChange?)` | 可读可写信号，返回 `{ get, set }`；默认 `simpleNotEqual` |
| `createLateSignal(value, shouldChange?)` | 只暴露 `get` 与一次性的 `getOnlySet()` |
| `memo(get, after?)` | 缓存计算值，结果未变化时不向下游传播；`after` 在结果变化后执行 |
| `trackSignal(get, set?)` | 依赖追踪，返回解除函数 |
| `addEffect(fn, level?)` | 批量更新结束后的回调，`level` 控制执行顺序 |
| `batchSignalEnd()` | 手动结束当前批次 |
| `toProxySignal(obj)` | 把对象的每个字段转为独立信号 |
| `signalCache` / `setBatchRunner` | 调度内部状态与自定义批量执行器 |

## 主入口其它模块

- `storeRef` - `StoreRef` 类型与 store 工具
- `equal` - `simpleEqual` / `simpleNotEqual` / 数组与对象比较
- `setStateHelper` - `GetValue` / `SetValue` / `Quote` 等类型
- `scheduler` - 同步/异步任务调度
- `effectLevel` - effect 层级常量
- `ValueCenter` / `ModelValue` / `LinkValue` - 值中心、双向模型、联动值
- `promise` - `PromiseResult`、串行请求、可中止 Promise、资源中心
- `animation` / `signal+animation` / `interpolate` - 动画、插值、缓动
- `geometry` / `layout` / `computePosition` - 几何与布局计算
- `date` / `YearMonthVirtualView` / `WeekVirtualView` - 日期与日历虚拟视图
- `recycleView` / `reorder` / `dragMove` / `diffMove` - 回收视图、排序、拖拽、diff 移动
- `path` / `color` / `material` / `input` / `canInput` - 路径、颜色、材质、输入判定
- `createOrProxy` - 按 key 懒创建代理对象
- `getGlobalThis` - 跨环境全局对象
- `debounceAndThrottle` / `tasks` - 防抖节流与任务队列

## 子路径

| 子路径 | 内容 |
| --- | --- |
| `wy-helper/tokenParser` | 词法/语法解析工具 |
| `wy-helper/infixLang` | 中缀表达式语言 |
| `wy-helper/kanren` | 逻辑编程 |
| `wy-helper/ObserverCenter` | 观察者中心 |
| `wy-helper/router` | 路由 |
| `wy-helper/forceLayout` | 力导向布局 |
| `wy-helper/viteImportMap` | 生成 Vite import map |
| `wy-helper/infix-o` | 中缀运算 |
| `wy-helper/state-function` | 状态函数 |

```ts
import * as kanren from 'wy-helper/kanren'
```

## License

MIT
