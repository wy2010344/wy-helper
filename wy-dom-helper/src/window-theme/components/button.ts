import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const button = createStyle(
  tokens => {
    return {
      button: {
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: tokens.spaceXs,
          padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
          border: `1px solid ${tokens.outline}`,
          borderRadius: tokens.radiusMd,
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          transition: tokens.transitionFast,
          textDecoration: 'none',
          position: 'relative',
          overflow: 'hidden',

          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
          },

          '&:disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
            transform: 'none !important',
          },
        },

        variants: {
          variant: {
            primary: {
              background: tokens.primary,
              color: tokens.onPrimary,
              borderColor: tokens.primary,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.primary} 90%, ${tokens.onPrimary})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            secondary: {
              background: tokens.surfaceContainerHigh,
              color: tokens.onSurface,
              borderColor: tokens.outline,

              '&:hover': {
                background: tokens.surfaceContainerHighest,
                borderColor: tokens.outline,
                transform: 'translateY(-1px)',
              },
            },

            tertiary: {
              background: tokens.tertiary,
              color: tokens.onTertiary,
              borderColor: tokens.tertiary,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.tertiary} 90%, ${tokens.onTertiary})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            success: {
              background: tokens.success,
              color: tokens.onSuccess,
              borderColor: tokens.success,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.success} 90%, ${tokens.onSuccess})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            warning: {
              background: tokens.warning,
              color: tokens.onWarning,
              borderColor: tokens.warning,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.warning} 90%, ${tokens.onWarning})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            danger: {
              background: tokens.error,
              color: tokens.onError,
              borderColor: tokens.error,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.error} 90%, ${tokens.onError})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            error: {
              background: tokens.error,
              color: tokens.onError,
              borderColor: tokens.error,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.error} 90%, ${tokens.onError})`,
                transform: 'translateY(-1px)',
                boxShadow: tokens.shadowMd,
              },
            },

            ghost: {
              background: 'transparent',
              color: tokens.onSurface,
              borderColor: tokens.outlineVariant,

              '&:hover': {
                background: tokens.surfaceContainer,
                borderColor: tokens.outline,
                transform: 'translateY(-1px)',
              },
            },
          },

          size: {
            sm: {
              padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
              fontSize: '12px',
            },

            md: emptyObject, // 默认尺寸，无额外样式

            lg: {
              padding: `${tokens.spaceMd} ${tokens.spaceLg}`,
              fontSize: '16px',
            },
          },

          iconOnly: {
            true: {
              width: '40px',
              height: '40px',
              padding: 0,
              justifyContent: 'center',
              border: 'none',
            },
            false: emptyObject,
          },
        },
      },
    };
  },
  {
    button: {
      variant: 'primary',
      size: 'md',
      iconOnly: false,
    },
  }
);
