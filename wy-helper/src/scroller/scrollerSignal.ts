import { createSignal, EmptyFun, emptyFun, GetValue, ReadArray, ValueOrGet, valueOrGetToGet } from "wy-helper";

import * as Animate from './scrollerAnimate'

// Easing Equations (c) 2003 Robert Penner, all rights reserved.
// Open source under the BSD License.

/**
 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
**/
export function easeOutCubic(pos: number) {
  return (Math.pow((pos - 1), 3) + 1);
};

/**
 * @param pos {Number} position between 0 (start of effect) and 1 (end of effect)
**/
export function easeInOutCubic(pos: number) {
  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(pos, 3);
  }

  return 0.5 * (Math.pow((pos - 2), 3) + 2);
};


export interface PagePoint {
  pageX: number
  pageY: number
}

export interface ClientOffset {
  left: number
  top: number
}
export function scrollerSignal(p: {
  clientWidth: ValueOrGet<number>
  clientHeight: ValueOrGet<number>
  contentWidth: ValueOrGet<number>
  contentHeight: ValueOrGet<number>

  snapWidth?: ValueOrGet<number>
  snapHeight?: ValueOrGet<number>


  scrollingX?: ValueOrGet<boolean>
  scrollingY?: ValueOrGet<boolean>
  zooming?: ValueOrGet<boolean>,
  maxZoom?: ValueOrGet<number>,
  minZoom?: ValueOrGet<number>,
  /** 启用弹跳（内容可以缓慢移出并在释放后跳回） */
  bouncing?: ValueOrGet<boolean>
  speedMultiplier?: ValueOrGet<number>
  locking?: ValueOrGet<boolean>
  /** 启用减速、快速返回、缩放和滚动的动画 */
  animating?: ValueOrGet<boolean>,
  paging?: ValueOrGet<boolean>
  snapping?: ValueOrGet<boolean>


  /** 增加或减少施加于减速的摩擦力量 **/
  decelerationRate?: ValueOrGet<number>,
  /** 配置到达边界时减速的变化量 **/
  penetrationDeceleration?: ValueOrGet<number>,
  /** 配置到达边界时加速度的变化量 **/
  penetrationAcceleration?: ValueOrGet<number>,
  animationDuration?: ValueOrGet<number>
  scrollingComplete?(): void
}, requestAnimateFrame: EmptyFun,) {
  const m = {
    /** Enable scrolling on x-axis */
    scrollingX: true,

    /** Enable scrolling on y-axis */
    scrollingY: true,
    /** 启用减速、快速返回、缩放和滚动的动画 */
    animating: true,
    /** scrollTo/zoomTo 触发动画的持续时间 */
    animationDuration: 250,
    /** 启用弹跳（内容可以缓慢移出并在释放后跳回） */
    bouncing: true,
    /** 如果用户在开始时仅在其中一个轴上稍微移动，则启用对主轴的锁定 */
    locking: true,
    /** 启用分页模式（在整页内容窗格之间切换） */
    paging: false,
    /** 启用内容捕捉到配置的像素网格 */
    snapping: false,
    /** 通过 API、手指和鼠标滚轮启用内容缩放 */
    zooming: false,

    /** Minimum zoom level */
    minZoom: 0.5,

    /** Maximum zoom level */
    maxZoom: 3,
    /** 增加或减少滚动速度 **/
    speedMultiplier: 1,
    /** 回调在触摸结束或减速结束时触发，
    前提是另一个滚动操作尚未开始。用于了解
    何时淡出滚动条。*/
    scrollingComplete: emptyFun,
    /** 增加或减少施加于减速的摩擦力量 **/
    decelerationRate: 0.95,
    /** 配置到达边界时减速的变化量 **/
    penetrationDeceleration: 0.03,
    /** 配置到达边界时加速度的变化量 **/
    penetrationAcceleration: 0.08,

    snapHeight: 0,
    snapWidth: 0,
    ...p
  } as Required<typeof p>
  const clientWidth = valueOrGetToGet(m.clientWidth)
  const clientHeight = valueOrGetToGet(m.clientHeight)
  const contentWidth = valueOrGetToGet(m.contentWidth)
  const contentHeight = valueOrGetToGet(m.contentHeight)
  const zooming = valueOrGetToGet(m.zooming)
  const minZoom = valueOrGetToGet(m.minZoom)
  const maxZoom = valueOrGetToGet(m.maxZoom)
  const scrollingX = valueOrGetToGet(m.scrollingX)
  const scrollingY = valueOrGetToGet(m.scrollingY)
  const speedMultiplier = valueOrGetToGet(m.speedMultiplier)
  const bouncing = valueOrGetToGet(m.bouncing)
  const locking = valueOrGetToGet(m.locking)
  const animating = valueOrGetToGet(m.animating)
  const paging = valueOrGetToGet(m.paging)
  const snapping = valueOrGetToGet(m.snapping)
  const penetrationDeceleration = valueOrGetToGet(m.penetrationDeceleration)
  const penetrationAcceleration = valueOrGetToGet(m.penetrationAcceleration)
  const decelerationRate = valueOrGetToGet(m.decelerationRate)
  const snapWidth = valueOrGetToGet(m.snapWidth)
  const snapHeight = valueOrGetToGet(m.snapHeight)
  const animationDuration = valueOrGetToGet(m.animationDuration)

  const zoomLevel = createSignal(1)
  const left = createSignal(0)
  const top = createSignal(0)
  const refreshActive = createSignal(false)
  function maxScrollLeft() {
    return Math.max((contentWidth() * zoomLevel.get()) - clientWidth(), 0)
  }
  function maxScrollTop() {
    return Math.max((contentHeight() * zoomLevel.get()) - clientHeight(), 0)
  }

  /**
   * {Boolean} Not touching and dragging anymore  and smoothly animating the
   * touch sequence using deceleration.
   */
  let __isDecelerating: false | EmptyFun = false

  /**
   * {Boolean} Smoothly animating the currently configured change
   */
  let __isAnimating: false | EmptyFun = false


  /* {Number} Scheduled left position (final position when animating) */
  let __scheduledLeft = 0

  /* {Number} Scheduled top position (final position when animating) */
  let __scheduledTop = 0
  let __zoomComplete: EmptyFun | null = null

  function publish(_left: number, _top: number, zoom: number, animate?: boolean) {
    // 记住我们是否有动画，然后我们尝试根据动画的当前“驱动”继续
    var wasAnimating = __isAnimating;
    if (wasAnimating) {
      wasAnimating()
      __isAnimating = false;
    }

    if (animate && animating()) {
      // 保持 scrollBy/zoomBy 功能的预定位置
      __scheduledLeft = _left;
      __scheduledTop = _top;
      var oldLeft = left.get();
      var oldTop = top.get();
      var oldZoom = zoomLevel.get();

      var diffLeft = _left - oldLeft;
      var diffTop = _top - oldTop;
      var diffZoom = zoom - oldZoom;

      // 当基于上一个动画继续时，我们选择缓出动画而不是缓入缓出动画
      __isAnimating = Animate.start(
        requestAnimateFrame,
        function (percent, _, render) {
          if (render) {
            left.set(oldLeft + (diffLeft * percent))
            top.set(oldTop + (diffTop * percent))
            zoomLevel.set(oldZoom + (diffZoom * percent))
          }
        },
        function (id) {
          return __isAnimating === id;
        },
        function (_, animationId, wasFinished) {
          if (animationId === __isAnimating) {
            __isAnimating = false;
          }
          if (__didDecelerationComplete || wasFinished) {
            m.scrollingComplete();
          }
          if (zooming()) {
            if (__zoomComplete) {
              __zoomComplete();
              __zoomComplete = null;
            }
          }
        },
        animationDuration(),
        wasAnimating ? easeOutCubic : easeInOutCubic);
    } else {
      left.set(_left)
      top.set(_top)
      zoomLevel.set(zoom)
      if (zooming()) {
        if (__zoomComplete) {
          __zoomComplete();
          __zoomComplete = null;
        }
      }
    }
  }
  /*** 滚动到指定位置。遵守限制并自动捕捉。
    *
    * @param _left {Number?null} 水平滚动位置，如果值为 <code>null</code>，则保持当前位置
    * @param _top {Number?null} 垂直滚动位置，如果值为 <code>null</code>，则保持当前位置
    * @param animate {Boolean?false} 是否应使用动画进行滚动
    * @param zoom {Number?null} 要达到的缩放级别
       */
  function scrollTo(_left: number, _top: number, animate?: boolean, zoom?: number) {
    // 停止减速
    if (__isDecelerating) {
      __isDecelerating()
      __isDecelerating = false;
    }
    // 根据新的缩放级别更正坐标
    if (zoom != null && zoom !== zoomLevel.get()) {

      if (!zooming()) {
        throw new Error("Zooming is not enabled!");
      }

      _left *= zoom;
      _top *= zoom;
      // 重新计算最大值，同时临时调整最大滚动范围
      zoomLevel.set(zoom)
    } else {
      // 未定义时保持缩放
      zoom = zoomLevel.get()
    }

    if (!scrollingX()) {
      _left = left.get()
    } else {
      if (paging()) {
        const cw = clientWidth()
        _left = Math.round(_left / cw) * cw;
      } else if (snapping()) {
        const sw = snapWidth()
        _left = Math.round(_left / sw) * sw;
      }
    }

    if (!scrollingY()) {
      _top = top.get()
    } else {
      if (paging()) {
        const ch = clientHeight()
        _top = Math.round(_top / ch) * ch;
      } else if (snapping()) {
        const sh = snapHeight()
        _top = Math.round(_top / sh) * sh;
      }
    }

    // 允许范围的限制
    _left = Math.max(Math.min(maxScrollLeft(), _left), 0);
    _top = Math.max(Math.min(maxScrollTop(), _top), 0);
    // 未检测到任何变化时不进行动画处理，仍调用发布以确保
    // 渲染位置确实与内部数据同步
    if (_left === left.get() && _top === top.get()) {
      animate = false;
    }
    // Publish new values
    publish(_left, _top, zoom, animate);
  }
  /**
 * 按给定的偏移量滚动
 * Scroll by the given offset
 */
  function scrollBy(_left: number, _top: number, animate?: boolean) {
    var startLeft = __isAnimating ? __scheduledLeft : left.get();
    var startTop = __isAnimating ? __scheduledTop : top.get();
    scrollTo(startLeft + (_left || 0), startTop + (_top || 0), animate);
  }

  /**
   * 缩放至指定级别。支持可选动画。缩放
   * 未指定坐标时缩放至中心。
   *
   * @param level {Number} 缩放至的级别
   * @param animate {Boolean ? false} 是否使用动画
   * @param originLeft {Number ? null} 在指定的左侧坐标处放大
   * @param originTop {Number ? null} 在指定的顶部坐标处放大
   * @param callback {Function ? null} 缩放完成时触发的回调。
   */
  function zoomTo(
    level: number,
    animate?: boolean,
    originLeft?: number,
    originTop?: number,
    callback?: EmptyFun) {
    if (!zooming()) {
      throw new Error("Zooming is not enabled!");
    }
    // Add callback if exists
    if (callback) {
      __zoomComplete = callback;
    }
    // Stop deceleration
    if (__isDecelerating) {
      __isDecelerating()
      __isDecelerating = false;
    }
    var oldLevel = zoomLevel.get();
    // Normalize input origin to center of viewport if not defined
    if (originLeft == null) {
      originLeft = clientWidth() / 2;
    }
    if (originTop == null) {
      originTop = clientHeight() / 2;
    }
    // Limit level according to configuration
    level = Math.max(Math.min(level, maxZoom()), minZoom());
    // Recompute left and top coordinates based on new zoom level
    var _left = ((originLeft + left.get()) * level / oldLevel) - originLeft;
    var _top = ((originTop + top.get()) * level / oldLevel) - originTop;
    // Limit x-axis
    const _maxScrollLeft = maxScrollLeft()
    if (_left > _maxScrollLeft) {
      _left = _maxScrollLeft;
    } else if (_left < 0) {
      _left = 0;
    }
    // Limit y-axis
    if (_top > maxScrollTop()) {
      _top = maxScrollTop();
    } else if (_top < 0) {
      _top = 0;
    }
    // Push values out
    publish(_left, _top, level, animate);
  }

  let __didDecelerationComplete = false
  function doTouchStart(
    touches: ReadArray<PagePoint>,
    timeStamp: number,
    refresh?: {
      refreshStart?: EmptyFun
      refreshDeactivate?: EmptyFun
      refreshActivate?: EmptyFun
      refreshHeight: number
    }
  ) {
    // Array-like check is enough here
    if (touches.length == null) {
      throw new Error("Invalid touch list: " + touches);
    }

    let interruptedAnimation = true

    // Stop deceleration
    if (__isDecelerating) {
      __isDecelerating()
      __isDecelerating = false;
      interruptedAnimation = true;
    }

    // Stop animation
    if (__isAnimating) {
      __isAnimating()
      __isAnimating = false;
      interruptedAnimation = true;
    }
    const n = toPoint(touches)
    let initialTouchLeft = n.currentTouchLeft
    let initialTouchTop = n.currentTouchTop


    let lastTouchLeft = n.currentTouchLeft
    let lastTouchTop = n.currentTouchTop
    const positions: number[] = []

    let isDragging = !n.isSingleTouch

    const isSingleTouch = n.isSingleTouch

    let enableScrollX = !isSingleTouch && scrollingX()
    let enableScrollY = !isSingleTouch && scrollingY()
    let lastScale = 1
    let lastTouchMove = timeStamp
    __didDecelerationComplete = false
    function doTouchMove(
      touches: ReadArray<PagePoint>,
      timeStamp: number,
      scale: number,
      getClient: GetValue<ClientOffset>
    ): void
    function doTouchMove(
      touches: ReadArray<PagePoint>,
      timeStamp: number, scale?: never, getClient?: never
    ): void
    function doTouchMove(
      touches: ReadArray<PagePoint>,
      timeStamp: number,
      scale?: number,
      getClient?: GetValue<ClientOffset>
    ) {
      if (touches.length == null) {
        throw new Error("Invalid touch list: " + touches);
      }

      const n = toPoint(touches)

      // 我们已经处于拖动模式了吗？
      if (isDragging) {
        // 计算移动距离
        var moveX = n.currentTouchLeft - lastTouchLeft;
        var moveY = n.currentTouchTop - lastTouchTop;

        let scrollLeft = left.get()
        let scrollTop = top.get()
        var level = zoomLevel.get();

        // Work with scaling
        if (scale && zooming()) {
          var oldLevel = level;
          // Recompute level based on previous scale and new scale
          level = level / lastScale * scale;

          // Limit level according to configuration
          level = Math.max(Math.min(level, maxZoom()), minZoom());

          // Only do further compution when change happened
          if (oldLevel !== level) {
            // Compute relative event position to container
            const client = getClient!()
            var currentTouchLeftRel = n.currentTouchLeft - client.left;
            var currentTouchTopRel = n.currentTouchTop - client.top;
            // Recompute left and top coordinates based on new zoom level
            scrollLeft = ((currentTouchLeftRel + scrollLeft) * level / oldLevel) - currentTouchLeftRel;
            scrollTop = ((currentTouchTopRel + scrollTop) * level / oldLevel) - currentTouchTopRel;
          }
        }

        if (enableScrollX) {
          scrollLeft -= moveX * speedMultiplier();
          var _maxScrollLeft = maxScrollLeft();
          if (scrollLeft > _maxScrollLeft || scrollLeft < 0) {
            // Slow down on the edges
            if (bouncing()) {
              scrollLeft += (moveX / 2 * speedMultiplier());
            } else if (scrollLeft > _maxScrollLeft) {
              scrollLeft = _maxScrollLeft;
            } else {
              scrollLeft = 0;
            }
          }
        }

        // Compute new vertical scroll position
        if (enableScrollY) {
          scrollTop -= moveY * speedMultiplier();
          var _maxScrollTop = maxScrollTop();
          if (scrollTop > _maxScrollTop || scrollTop < 0) {
            // Slow down on the edges
            if (bouncing()) {
              scrollTop += (moveY / 2 * speedMultiplier());
              // Support pull-to-refresh (only when only y is scrollable)
              if (!enableScrollX && refresh?.refreshHeight) {
                if (!refreshActive.get() && scrollTop <= -refresh.refreshHeight) {
                  refreshActive.set(true);
                  refresh?.refreshActivate?.();
                } else if (refreshActive.get() && scrollTop > -refresh.refreshHeight) {
                  refreshActive.set(false);
                  refresh?.refreshDeactivate?.()
                }
              }
            } else if (scrollTop > _maxScrollTop) {
              scrollTop = _maxScrollTop;
            } else {
              scrollTop = 0;
            }
          }
        }
        // Keep list from growing infinitely (holding min 10, max 20 measure points)
        if (positions.length > 60) {
          positions.splice(0, 30);
        }
        // Track scroll movement for decleration
        positions.push(scrollLeft, scrollTop, timeStamp);
        // Sync scroll position
        publish(scrollLeft, scrollTop, level);
        // Otherwise figure out whether we are switching into dragging mode now.
      } else {

        var minimumTrackingForScroll = locking() ? 3 : 0;
        var minimumTrackingForDrag = 5;

        var distanceX = Math.abs(n.currentTouchLeft - initialTouchLeft);
        var distanceY = Math.abs(n.currentTouchTop - initialTouchTop);

        enableScrollX = scrollingX() && distanceX >= minimumTrackingForScroll;
        enableScrollY = scrollingY() && distanceY >= minimumTrackingForScroll;

        positions.push(left.get(), top.get(), timeStamp);

        isDragging = (enableScrollX || enableScrollY) && (distanceX >= minimumTrackingForDrag || distanceY >= minimumTrackingForDrag);
        if (isDragging) {
          interruptedAnimation = false;
        }

      }
      // Update last touch positions and time stamp for next event
      lastTouchLeft = n.currentTouchLeft;
      lastTouchTop = n.currentTouchTop;
      lastTouchMove = timeStamp;
      lastScale = scale || 1;
    }

    function doTouchEnd(
      timeStamp: number
    ) {
      if (isDragging) {
        // 开始减速
        // 验证检测到的最后移动是否在某个相关的时间范围内
        if (isSingleTouch && animating() && (timeStamp - lastTouchMove) <= 100) {
          // 然后找出大约 100 毫秒前的滚动位置
          var endPos = positions.length - 1;
          var startPos = endPos;
          // 将指针移动到 100 毫秒前测量的位置
          for (var i = endPos; i > 0 && positions[i] > (lastTouchMove - 100); i -= 3) {
            startPos = i;
          }

          /**
           // 如果我们在 100 毫秒内没有收到连续的 touchmove 事件，
            // 则根据第一个位置尝试尽最大努力。
            // 这种情况通常发生在滚动期间主线程上发生昂贵的操作时，例如图像解码。
            */
          if (startPos === endPos && positions.length > 5) {
            startPos = 2;
          }

          /**
          // 如果在 100 毫秒的时间范围内开始和停止位置相同，
          // 我们无法计算任何有用的减速。
            */
          if (startPos !== endPos) {
            // 计算这两点之间的相对运动
            var timeOffset = positions[endPos] - positions[startPos];
            var movedLeft = left.get() - positions[startPos - 2];
            var movedTop = top.get() - positions[startPos - 1];

            // 基于 50ms 计算每个渲染步骤所需的移动量
            let decelerationVelocityX = movedLeft / timeOffset * (1000 / 60);
            let decelerationVelocityY = movedTop / timeOffset * (1000 / 60);
            // 需要多少速度来开始减速
            var minVelocityToStartDeceleration = paging() || snapping() ? 4 : 1;
            // 验证我们是否有足够的速度来开始减速
            if (Math.abs(decelerationVelocityX) > minVelocityToStartDeceleration || Math.abs(decelerationVelocityY) > minVelocityToStartDeceleration) {
              // 减速时停用下拉刷新
              if (!refreshActive.get()) {
                // self.__startDeceleration(timeStamp);
                /*** 当触摸序列结束且手指速度足够高时调用
              * 切换到减速模式。
                 */
                /** {Integer} Minimum left scroll position during deceleration */
                let __minDecelerationScrollLeft = 0
                /** {Integer} Minimum top scroll position during deceleration */
                let __minDecelerationScrollTop = 0
                /** {Integer} Maximum left scroll position during deceleration */
                let __maxDecelerationScrollLeft = 0
                /** {Integer} Maximum top scroll position during deceleration */
                let __maxDecelerationScrollTop = 0
                if (paging()) {
                  var scrollLeft = Math.max(Math.min(left.get(), maxScrollLeft()), 0);
                  var scrollTop = Math.max(Math.min(top.get(), maxScrollTop()), 0);
                  var _clientWidth = clientWidth();
                  var _clientHeight = clientHeight();
                  // 我们将减速限制在允许范围的最小/最大值，而不是可见客户区的大小。
                  // 每个页面应具有与客户区完全相同的大小。
                  __minDecelerationScrollLeft = Math.floor(scrollLeft / _clientWidth) * _clientWidth;
                  __minDecelerationScrollTop = Math.floor(scrollTop / _clientHeight) * _clientHeight;
                  __maxDecelerationScrollLeft = Math.ceil(scrollLeft / _clientWidth) * _clientWidth;
                  __maxDecelerationScrollTop = Math.ceil(scrollTop / _clientHeight) * _clientHeight;
                } else {
                  __minDecelerationScrollLeft = 0;
                  __minDecelerationScrollTop = 0;
                  __maxDecelerationScrollLeft = maxScrollLeft()
                  __maxDecelerationScrollTop = maxScrollTop()
                }
                // 需要多少速度才能保持减速运行
                var minVelocityToKeepDecelerating = snapping() ? 4 : 0.1;
                // 开始动画并打开标志
                __isDecelerating = Animate.start(
                  requestAnimateFrame,
                  function (percent: number, now: number, render: boolean) {
                    // 计算下一个滚动位置
                    // 为滚动位置添加减速
                    //在动画的每个步骤上调用
                    var scrollLeft = left.get() + decelerationVelocityX;
                    var scrollTop = top.get() + decelerationVelocityY;
                    //
                    // 非弹跳模式的硬限制滚动位置
                    //
                    if (!bouncing()) {
                      var scrollLeftFixed = Math.max(Math.min(__maxDecelerationScrollLeft, scrollLeft), __minDecelerationScrollLeft);
                      if (scrollLeftFixed !== scrollLeft) {
                        scrollLeft = scrollLeftFixed;
                        decelerationVelocityX = 0;
                      }
                      var scrollTopFixed = Math.max(Math.min(__maxDecelerationScrollTop, scrollTop), __minDecelerationScrollTop);
                      if (scrollTopFixed !== scrollTop) {
                        scrollTop = scrollTopFixed;
                        decelerationVelocityY = 0;
                      }
                    }
                    //
                    // 更新滚动位置
                    //
                    if (render) {
                      publish(scrollLeft, scrollTop, zoomLevel.get());
                    } else {
                      left.set(scrollLeft)
                      top.set(scrollTop)
                    }
                    //
                    // SLOW DOWN
                    //
                    // Slow down velocity on every iteration
                    if (!paging()) {
                      // 这是应用于动画每次迭代的因素
                      // 以减慢进程。这应该模拟自然行为，其中
                      // 当移动发起者被移除时，物体会减速
                      var frictionFactor = decelerationRate();

                      decelerationVelocityX *= frictionFactor;
                      decelerationVelocityY *= frictionFactor;
                    }
                    //
                    // BOUNCING SUPPORT
                    //
                    if (bouncing()) {
                      var scrollOutsideX = 0;
                      var scrollOutsideY = 0;
                      // 这配置了到达边界时减速/加速的变化量
                      var _penetrationDeceleration = penetrationDeceleration();
                      var _penetrationAcceleration = penetrationAcceleration();

                      // Check limits
                      if (scrollLeft < __minDecelerationScrollLeft) {
                        scrollOutsideX = __minDecelerationScrollLeft - scrollLeft;
                      } else if (scrollLeft > __maxDecelerationScrollLeft) {
                        scrollOutsideX = __maxDecelerationScrollLeft - scrollLeft;
                      }

                      if (scrollTop < __minDecelerationScrollTop) {
                        scrollOutsideY = __minDecelerationScrollTop - scrollTop;
                      } else if (scrollTop > __maxDecelerationScrollTop) {
                        scrollOutsideY = __maxDecelerationScrollTop - scrollTop;
                      }
                      // 减速直到足够慢，然后翻转回捕捉位置
                      if (scrollOutsideX !== 0) {
                        if (scrollOutsideX * decelerationVelocityX <= 0) {
                          decelerationVelocityX += scrollOutsideX * _penetrationDeceleration;
                        } else {
                          decelerationVelocityX = scrollOutsideX * _penetrationAcceleration;
                        }
                      }

                      if (scrollOutsideY !== 0) {
                        if (scrollOutsideY * decelerationVelocityY <= 0) {
                          decelerationVelocityY += scrollOutsideY * _penetrationDeceleration;
                        } else {
                          decelerationVelocityY = scrollOutsideY * _penetrationAcceleration;
                        }
                      }
                    }
                  },
                  // 检测是否仍然值得继续动画步骤
                  // 如果我们已经慢到用户无法察觉的程度，我们就在这里停止整个过程。
                  function () {
                    var shouldContinue = Math.abs(decelerationVelocityX) >= minVelocityToKeepDecelerating || Math.abs(decelerationVelocityY) >= minVelocityToKeepDecelerating;
                    if (!shouldContinue) {
                      __didDecelerationComplete = true;
                    }
                    return shouldContinue;
                  },
                  function () {
                    __isDecelerating = false;
                    if (__didDecelerationComplete) {
                      m.scrollingComplete();
                    }
                    // 当捕捉处于活动状态时，动画到网格，否则只需修复边界外的位置
                    scrollTo(left.get(), top.get(), snapping());
                  });
              }
            }
          } else {
            m.scrollingComplete();
          }
        } else if ((timeStamp - lastTouchMove) > 100) {
          m.scrollingComplete();
        }
      }

      // 如果这是一个较慢的移动，则默认情况下不会减速，但这
      // 仍然意味着我们希望快速回到边界，这是在这里完成的。
      // 这被放置在上述条件之外，以提高边缘情况的稳定性
      // 例如，在未启用拖动的情况下触发 touchend。这通常不应该
      // 修改滚动位置，甚至显示滚动条。
      if (!__isDecelerating) {
        if (refreshActive.get() && refresh?.refreshStart) {
          // 使用 publish 而不是 scrollTo 来允许滚动到边界位置之外
          // 我们不需要在这里规范化 scrollLeft、zoomLevel 等，因为我们只在启用下拉刷新时进行 y 滚动
          if (refresh.refreshHeight) {
            publish(left.get(), -refresh.refreshHeight, zoomLevel.get(), true);
          }
          refresh?.refreshStart();
        } else {
          if (interruptedAnimation || isDragging) {
            m.scrollingComplete();
          }
          scrollTo(left.get(), top.get(), true, zoomLevel.get());
          // 直接发出停用信号（刷新时无需执行任何操作？）
          if (refreshActive.get()) {
            refreshActive.set(false);
            refresh?.refreshDeactivate?.();
          }
        }
      }
      // 完全清理列表
      positions.length = 0;
    }


    return {
      doTouchMove,
      doTouchEnd
    }
  }

  return {
    scrollBy,
    scrollTo,
    zoomTo,
    doTouchStart,
    triggerPullToRefresh(refreshHeight: number) {
      publish(left.get(), -refreshHeight, zoomLevel.get(), true)
    },
    finishPullToRefresh() {
      refreshActive.set(false)
      scrollTo(left.get(), top.get(), true)
    },
    refreshActive: refreshActive.get,
    zoomLevel: zoomLevel.get,
    left: left.get,
    top: top.get,
    doMouseZoom(
      wheelDelta: number,
      clientX: number,
      clientY: number) {
      var change = wheelDelta > 0 ? 0.97 : 1.03;
      return zoomTo(zoomLevel.get() * change, false, clientX, clientY);
    },
    /*** 
  * 按给定的倍数缩放内容。
*
* @param factor  按给定的倍数缩放
* @param animate  是否使用动画
* @param originLeft  在给定的左侧坐标处放大
* @param originTop 在给定的顶部坐标处放大
* @param callback 缩放完成时触发的回调。
  */
    zoomBy(factor: number, animate?: boolean, originLeft = 0, originTop = 0, callback?: EmptyFun) {
      zoomTo(zoomLevel.get() * factor, animate, originLeft, originTop, callback);
    }
  }
}

function toPoint(touches: ReadArray<PagePoint>) {
  // Use center point when dealing with two fingers
  let currentTouchLeft, currentTouchTop;
  let isSingleTouch = touches.length === 1;
  if (isSingleTouch) {
    currentTouchLeft = touches[0].pageX;
    currentTouchTop = touches[0].pageY;
  } else {
    currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
    currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
  }
  return {
    isSingleTouch,
    currentTouchLeft,
    currentTouchTop
  }
}