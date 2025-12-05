import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const scrollbar = createStyle(
  tokens => {
    return {
      scrollbar: {
        base: {
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${tokens.colorOutline} transparent`,

          // 自定义滚动条样式 (Webkit)
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },

          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            margin: '2px',
          },

          '&::-webkit-scrollbar-thumb': {
            background: `color-mix(in srgb, ${tokens.colorOutline} 60%, transparent)`,
            borderRadius: '10px',
            border: `2px solid transparent`,
            backgroundClip: 'padding-box',
            transition: `background ${tokens.transitionFast}`,

            '&:hover': {
              background: `color-mix(in srgb, ${tokens.colorOutline} 80%, transparent)`,
              backgroundClip: 'padding-box',
            },

            '&:active': {
              background: tokens.colorOutline,
              backgroundClip: 'padding-box',
            },
          },

          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
        },

        variants: {
          variant: {
            default: emptyObject,

            thin: {
              '&::-webkit-scrollbar': {
                width: '6px',
                height: '6px',
              },
            },

            overlay: {
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: `color-mix(in srgb, ${tokens.colorOutline} 40%, transparent)`,
              },
              '&:hover::-webkit-scrollbar-thumb': {
                background: `color-mix(in srgb, ${tokens.colorOutline} 60%, transparent)`,
              },
            },

            hidden: {
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
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
