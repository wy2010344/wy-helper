import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const button = createStyle(
  tokens => {
    return {
      button: {
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spaceXs,
          padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
          border: 'none',
          borderRadius: tokens.radiusMd,
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          transition: `all ${tokens.transitionFast}`,
          textDecoration: 'none',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          lineHeight: '1.5',

          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
          },

          '&:active::before': {
            width: '300px',
            height: '300px',
          },

          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tokens.colorPrimary} 30%, transparent)`,
          },

          '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none !important',
          },
        },

        variants: {
          variant: {
            primary: {
              background: tokens.colorPrimary,
              color: tokens.colorOnPrimary,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorPrimary} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
                boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,
              },
            },

            secondary: {
              background: tokens.colorSurfaceContainerHigh,
              color: tokens.colorOnSurface,
              border: `1px solid ${tokens.colorOutlineVariant}`,

              '&:hover:not(:disabled)': {
                background: tokens.colorSurfaceContainerHighest,
                borderColor: tokens.colorOutline,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            tertiary: {
              background: tokens.colorTertiary,
              color: tokens.colorOnTertiary,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorTertiary} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            success: {
              background: tokens.colorSuccess,
              color: tokens.colorOnSuccess,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorSuccess} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            warning: {
              background: tokens.colorWarning,
              color: tokens.colorOnWarning,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorWarning} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            danger: {
              background: tokens.colorError,
              color: tokens.colorOnError,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorError} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            error: {
              background: tokens.colorError,
              color: tokens.colorOnError,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorError} 92%, black)`,
                boxShadow: tokens.shadowMd,
                transform: 'translateY(-1px)',
              },

              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            },

            ghost: {
              background: 'transparent',
              color: tokens.colorOnSurface,

              '&:hover:not(:disabled)': {
                background: tokens.colorSurfaceContainerHigh,
              },

              '&:active:not(:disabled)': {
                background: tokens.colorSurfaceContainerHighest,
              },
            },

            outline: {
              background: 'transparent',
              color: tokens.colorPrimary,
              border: `1px solid ${tokens.colorPrimary}`,

              '&:hover:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorPrimary} 8%, transparent)`,
                borderColor: `color-mix(in srgb, ${tokens.colorPrimary} 92%, black)`,
              },

              '&:active:not(:disabled)': {
                background: `color-mix(in srgb, ${tokens.colorPrimary} 12%, transparent)`,
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
