import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const statusBar = createStyle(
  tokens => {
    return {
      statusBar: {
        base: {
          height: '24px',
          padding: `0 ${tokens.spaceMd}`,
          backdropFilter: 'blur(12px)',
          color: tokens.colorOnSurface,
          fontSize: '14px',
          borderRadius: `0 0 ${tokens.radiusXl} ${tokens.radiusXl}`,
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          background: `color-mix(in srgb, ${tokens.colorSurfaceContainer} 80%, transparent)`,
        },

        variants: {
          variant: {
            default: emptyObject,

            primary: {
              background: `color-mix(in srgb, ${tokens.colorPrimary} 80%, transparent)`,
              color: tokens.colorOnPrimary,
            },

            success: {
              background: `color-mix(in srgb, ${tokens.colorSuccess} 80%, transparent)`,
              color: tokens.colorOnSuccess,
            },

            warning: {
              background: `color-mix(in srgb, ${tokens.colorWarning} 80%, transparent)`,
              color: tokens.colorOnWarning,
            },

            error: {
              background: `color-mix(in srgb, ${tokens.colorError} 80%, transparent)`,
              color: tokens.colorOnError,
            },
          },

          size: {
            sm: {
              height: '20px',
              fontSize: '12px',
              padding: `0 ${tokens.spaceSm}`,
            },

            md: emptyObject, // 默认尺寸

            lg: {
              height: '32px',
              fontSize: '16px',
              padding: `0 ${tokens.spaceLg}`,
            },
          },
        },
      },
    };
  },
  {
    statusBar: {
      variant: 'default',
      size: 'md',
    },
  }
);
