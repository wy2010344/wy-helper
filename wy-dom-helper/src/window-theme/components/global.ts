import { createStyle } from '../util';

// Global 全局样式
export const global = createStyle(
  tokens => ({
    root: {
      base: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        color: tokens.colorOnSurface,
        background: tokens.colorBackground,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      },
    },
    body: {
      base: {
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        background: tokens.colorBackground,
        color: tokens.colorOnSurface,
      },
    },
    // 重置样式
    reset: {
      base: {
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        'h1, h2, h3, h4, h5, h6': {
          margin: 0,
          fontWeight: 600,
          lineHeight: '1.2',
        },
        'p': {
          margin: 0,
        },
        'button': {
          fontFamily: 'inherit',
        },
        'input, textarea, select': {
          fontFamily: 'inherit',
        },
      },
    },
    // 辅助类
    utils: {
      base: {
        '.truncate': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        '.line-clamp-2': {
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
        '.line-clamp-3': {
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        },
      },
    },
  }),
  {
    root: {},
    body: {},
    reset: {},
    utils: {},
  }
);
