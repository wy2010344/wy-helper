import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const input = createStyle(
  tokens => ({
    input: {
      base: {
        padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
        background: tokens.colorSurfaceContainerLow,
        border: `1px solid ${tokens.colorOutlineVariant}`,
        borderRadius: tokens.radiusMd,
        color: tokens.colorOnSurface,
        fontSize: '14px',
        lineHeight: '1.5',
        transition: `all ${tokens.transitionFast}`,
        width: '100%',
        
        '&:hover:not(:disabled)': {
          borderColor: tokens.colorOutline,
          background: tokens.colorSurfaceContainer,
        },

        '&:focus': {
          outline: 'none',
          borderColor: tokens.colorPrimary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorPrimary} 15%, transparent)`,
          background: tokens.colorSurfaceContainerHigh,
        },

        '&::placeholder': {
          color: tokens.colorOnSurfaceVariant,
          opacity: 0.7,
        },

        '&:disabled': {
          background: tokens.colorSurfaceContainer,
          color: `color-mix(in srgb, ${tokens.colorOnSurface} 38%, transparent)`,
          cursor: 'not-allowed',
          opacity: 0.6,
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.colorError,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorError} 20%, transparent)`,
          },
          false: emptyObject,
        },
        size: {
          sm: {
            padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
            fontSize: '12px',
          },
          md: emptyObject,
          lg: {
            padding: `${tokens.spaceMd} ${tokens.spaceLg}`,
            fontSize: '16px',
          },
        },
      },
    },
    textarea: {
      base: {
        padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
        background: tokens.colorSurfaceContainer,
        border: `1px solid ${tokens.colorOutline}`,
        borderRadius: tokens.radiusMd,
        color: tokens.colorOnSurface,
        fontSize: '14px',
        transition: tokens.transitionFast,
        width: '100%',
        resize: 'vertical',
        minHeight: '80px',
        fontFamily: 'inherit',
        '&:focus': {
          outline: 'none',
          borderColor: tokens.colorPrimary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorPrimary} 30%, transparent)`,
          background: tokens.colorSurfaceContainerHigh,
        },
        '&::placeholder': {
          color: tokens.colorOnSurfaceVariant,
        },
        '&:disabled': {
          background: tokens.colorSurfaceContainer,
          color: 'color-mix(in srgb, var(--on-surface) 38%, transparent)',
          cursor: 'not-allowed',
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.colorError,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorError} 20%, transparent)`,
          },
          false: emptyObject,
        },
      },
    },
    select: {
      base: {
        padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
        background: tokens.colorSurfaceContainer,
        border: `1px solid ${tokens.colorOutline}`,
        borderRadius: tokens.radiusMd,
        color: tokens.colorOnSurface,
        fontSize: '14px',
        transition: tokens.transitionFast,
        width: '100%',
        cursor: 'pointer',
        '&:focus': {
          outline: 'none',
          borderColor: tokens.colorPrimary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorPrimary} 30%, transparent)`,
          background: tokens.colorSurfaceContainerHigh,
        },
        '&:disabled': {
          background: tokens.colorSurfaceContainer,
          color: 'color-mix(in srgb, var(--on-surface) 38%, transparent)',
          cursor: 'not-allowed',
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.colorError,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorError} 20%, transparent)`,
          },
          false: emptyObject,
        },
      },
    },
    checkboxLabel: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        cursor: 'pointer',
        fontSize: '14px',
        color: tokens.colorOnSurface,
        '& input': {
          width: '16px',
          height: '16px',
          accentColor: tokens.colorPrimary,
          cursor: 'pointer',
        },
      },
    },
    radioLabel: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        cursor: 'pointer',
        fontSize: '14px',
        color: tokens.colorOnSurface,
        '& input': {
          width: '16px',
          height: '16px',
          accentColor: tokens.colorPrimary,
          cursor: 'pointer',
        },
      },
    },
  }),
  {
    input: {
      error: false,
      size: 'md',
    },
    textarea: {
      error: false,
    },
    select: {
      error: false,
    },
    checkboxLabel: {},
    radioLabel: {},
  }
);
