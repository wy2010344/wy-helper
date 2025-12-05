import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// Dropdown 下拉菜单组件
export const dropdown = createStyle(
  tokens => ({
    dropdown: {
      base: {
        position: 'relative',
        display: 'inline-block',
      },
    },
    trigger: {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spaceXs,
        cursor: 'pointer',
      },
    },
    content: {
      base: {
        position: 'absolute',
        zIndex: 1000,
        marginTop: tokens.spaceXs,
      },
      variants: {
        placement: {
          'bottom-start': {
            top: '100%',
            left: 0,
          },
          'bottom-end': {
            top: '100%',
            right: 0,
          },
          'top-start': {
            bottom: '100%',
            left: 0,
            marginTop: 0,
            marginBottom: tokens.spaceXs,
          },
          'top-end': {
            bottom: '100%',
            right: 0,
            marginTop: 0,
            marginBottom: tokens.spaceXs,
          },
        },
      },
    },
  }),
  {
    dropdown: {},
    trigger: {},
    content: {
      placement: 'bottom-start',
    },
  }
);
