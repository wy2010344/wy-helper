import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const input = createStyle(
  tokens => ({
    input: {
      base: {
        padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outline}`,
        borderRadius: tokens.radiusMd,
        color: tokens.onSurface,
        fontSize: '14px',
        transition: tokens.transitionFast,
        width: '100%',
        '&:focus': {
          outline: 'none',
          borderColor: tokens.primary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
          background: tokens.surfaceContainerHigh,
        },
        '&::placeholder': {
          color: tokens.colorOnSurfaceVariant,
        },
        '&:disabled': {
          background: tokens.surfaceContainer,
          color: 'color-mix(in srgb, var(--on-surface) 38%, transparent)',
          cursor: 'not-allowed',
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.error,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.error} 20%, transparent)`,
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
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outline}`,
        borderRadius: tokens.radiusMd,
        color: tokens.onSurface,
        fontSize: '14px',
        transition: tokens.transitionFast,
        width: '100%',
        resize: 'vertical',
        minHeight: '80px',
        fontFamily: 'inherit',
        '&:focus': {
          outline: 'none',
          borderColor: tokens.primary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
          background: tokens.surfaceContainerHigh,
        },
        '&::placeholder': {
          color: tokens.colorOnSurfaceVariant,
        },
        '&:disabled': {
          background: tokens.surfaceContainer,
          color: 'color-mix(in srgb, var(--on-surface) 38%, transparent)',
          cursor: 'not-allowed',
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.error,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.error} 20%, transparent)`,
          },
          false: emptyObject,
        },
      },
    },
    select: {
      base: {
        padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outline}`,
        borderRadius: tokens.radiusMd,
        color: tokens.onSurface,
        fontSize: '14px',
        transition: tokens.transitionFast,
        width: '100%',
        cursor: 'pointer',
        '&:focus': {
          outline: 'none',
          borderColor: tokens.primary,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
          background: tokens.surfaceContainerHigh,
        },
        '&:disabled': {
          background: tokens.surfaceContainer,
          color: 'color-mix(in srgb, var(--on-surface) 38%, transparent)',
          cursor: 'not-allowed',
        },
      },
      variants: {
        error: {
          true: {
            borderColor: tokens.error,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.error} 20%, transparent)`,
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
        color: tokens.onSurface,
        '& input': {
          width: '16px',
          height: '16px',
          accentColor: tokens.primary,
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
        color: tokens.onSurface,
        '& input': {
          width: '16px',
          height: '16px',
          accentColor: tokens.primary,
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
