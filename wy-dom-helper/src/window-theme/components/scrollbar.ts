import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const scrollbar = createStyle(
  tokens => {
    return {
      scrollbar: {
        base: {
          minHeight: 0,
          overflowY: 'auto',

          // 自定义滚动条样式
          '&::-webkit-scrollbar': {
            width: '8px',
          },

          '&::-webkit-scrollbar-track': {
            background: tokens.surfaceContainer,
            borderRadius: tokens.radiusSm,
          },

          '&::-webkit-scrollbar-thumb': {
            background: tokens.outline,
            borderRadius: tokens.radiusSm,
            transition: tokens.transitionFast,

            '&:hover': {
              background: tokens.onSurface,
            },
          },

          '&::-webkit-scrollbar-corner': {
            background: tokens.surfaceContainer,
          },
        },

        variants: {
          variant: {
            default: emptyObject,

            thin: {
              '&::-webkit-scrollbar': {
                width: '4px',
              },
            },

            hidden: {
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE
            },
          },
        },
      },
    };
  },
  {
    scrollbar: {
      variant: 'default',
    },
  }
);
