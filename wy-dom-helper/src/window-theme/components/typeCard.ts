import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const typeCard = createStyle(
  tokens => {
    return {
      typeCard: {
        base: {
          background: tokens.surfaceContainer,
          border: `1px solid ${tokens.outline}`,
          borderRadius: tokens.radiusLg,
          padding: tokens.spaceLg,
          cursor: 'pointer',
          transition: tokens.transitionFast,

          '&:hover': {
            background: tokens.surfaceContainerHigh,
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadowMd,
          },
        },

        variants: {
          variant: {
            default: emptyObject,

            primary: {
              borderColor: tokens.primary,
              background: `color-mix(in srgb, ${tokens.primary} 5%, ${tokens.surfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.primary} 10%, ${tokens.surfaceContainer})`,
              },
            },

            secondary: {
              borderColor: tokens.secondary,
              background: `color-mix(in srgb, ${tokens.secondary} 5%, ${tokens.surfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.secondary} 10%, ${tokens.surfaceContainer})`,
              },
            },

            tertiary: {
              borderColor: tokens.tertiary,
              background: `color-mix(in srgb, ${tokens.tertiary} 5%, ${tokens.surfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.tertiary} 10%, ${tokens.surfaceContainer})`,
              },
            },
          },

          part: {
            card: emptyObject,

            header: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.spaceMd,
            },

            title: {
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: tokens.onSurface,
            },

            count: {
              fontSize: '14px',
              fontWeight: 500,
              color: tokens.primary,
              background: `color-mix(in srgb, ${tokens.primary} 10%, transparent)`,
              padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
              borderRadius: tokens.radiusSm,
            },

            description: {
              margin: 0,
              fontSize: '14px',
              color: tokens.colorOnSurfaceVariant,
              lineHeight: '1.5',
            },
          },
        },
      },
    };
  },
  {
    typeCard: {
      variant: 'default',
      part: 'card',
    },
  }
);

export const colorPicker = createStyle(
  tokens => {
    return {
      colorPicker: {
        base: {
          display: 'inline-block',
          width: '32px',
          height: '32px',
          borderRadius: tokens.radiusMd,
          border: `2px solid ${tokens.outline}`,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: tokens.transitionFast,

          '&:hover': {
            transform: 'scale(1.1)',
            borderColor: tokens.primary,
          },
        },

        variants: {
          part: {
            label: emptyObject,

            input: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            },
          },
        },
      },
    };
  },
  {
    colorPicker: {
      part: 'label',
    },
  }
);

export const statusIndicator = createStyle(
  tokens => {
    return {
      statusIndicator: {
        base: {
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spaceSm,
        },

        variants: {
          part: {
            indicator: emptyObject,

            dot: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
            },

            label: {
              fontSize: '14px',
              color: tokens.onSurface,
            },
          },

          status: {
            success: {
              background: tokens.success,
            },

            warning: {
              background: tokens.warning,
            },

            error: {
              background: tokens.error,
            },

            info: {
              background: tokens.primary,
            },
          },
        },
      },
    };
  },
  {
    statusIndicator: {
      part: 'indicator',
    },
  }
);
