import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// Checkbox 复选框组件
export const checkbox = createStyle(
  tokens => ({
    checkboxWrapper: {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        cursor: 'pointer',
        position: 'relative',
      },
      variants: {
        disabled: {
          true: {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
          false: emptyObject,
        },
      },
    },
    checkbox: {
      base: {
        position: 'relative',
        width: '18px',
        height: '18px',
        flexShrink: 0,
        '& input': {
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        },
      },
    },
    checkboxBox: {
      base: {
        width: '18px',
        height: '18px',
        border: `2px solid ${tokens.colorOutline}`,
        borderRadius: tokens.radiusSm,
        background: tokens.colorSurfaceContainer,
        transition: tokens.transitionFast,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          borderColor: tokens.colorPrimary,
          background: `color-mix(in srgb, ${tokens.colorPrimary} 5%, ${tokens.colorSurfaceContainer})`,
        },
      },
      variants: {
        checked: {
          true: {
            background: tokens.colorPrimary,
            borderColor: tokens.colorPrimary,
            '&::after': {
              content: '""',
              width: '4px',
              height: '8px',
              border: `solid ${tokens.colorOnPrimary}`,
              borderWidth: '0 2px 2px 0',
              transform: 'rotate(45deg)',
              marginBottom: '2px',
            },
          },
          false: emptyObject,
        },
        indeterminate: {
          true: {
            background: tokens.colorPrimary,
            borderColor: tokens.colorPrimary,
            '&::after': {
              content: '""',
              width: '10px',
              height: '2px',
              background: tokens.colorOnPrimary,
            },
          },
          false: emptyObject,
        },
      },
    },
    checkboxLabel: {
      base: {
        fontSize: '14px',
        color: tokens.colorOnSurface,
        userSelect: 'none',
      },
    },
  }),
  {
    checkboxWrapper: {
      disabled: false,
    },
    checkbox: {},
    checkboxBox: {
      checked: false,
      indeterminate: false,
    },
    checkboxLabel: {},
  }
);

// Radio 单选框组件
export const radio = createStyle(
  tokens => ({
    radioWrapper: {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        cursor: 'pointer',
        position: 'relative',
      },
      variants: {
        disabled: {
          true: {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
          false: emptyObject,
        },
      },
    },
    radio: {
      base: {
        position: 'relative',
        width: '18px',
        height: '18px',
        flexShrink: 0,
        '& input': {
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        },
      },
    },
    radioCircle: {
      base: {
        width: '18px',
        height: '18px',
        border: `2px solid ${tokens.colorOutline}`,
        borderRadius: '50%',
        background: tokens.colorSurfaceContainer,
        transition: tokens.transitionFast,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          borderColor: tokens.colorPrimary,
          background: `color-mix(in srgb, ${tokens.colorPrimary} 5%, ${tokens.colorSurfaceContainer})`,
        },
      },
      variants: {
        checked: {
          true: {
            borderColor: tokens.colorPrimary,
            '&::after': {
              content: '""',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: tokens.colorPrimary,
            },
          },
          false: emptyObject,
        },
      },
    },
    radioLabel: {
      base: {
        fontSize: '14px',
        color: tokens.colorOnSurface,
        userSelect: 'none',
      },
    },
  }),
  {
    radioWrapper: {
      disabled: false,
    },
    radio: {},
    radioCircle: {
      checked: false,
    },
    radioLabel: {},
  }
);
