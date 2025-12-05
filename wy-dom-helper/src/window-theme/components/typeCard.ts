import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const typeCard = createStyle(
  tokens => {
    return {
      typeCard: {
        base: {
          background: tokens.colorSurfaceContainer,
          border: `1px solid ${tokens.colorOutline}`,
          borderRadius: tokens.radiusLg,
          padding: tokens.spaceLg,
          cursor: 'pointer',
          transition: tokens.transitionFast,

          '&:hover': {
            background: tokens.colorSurfaceContainerHigh,
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadowMd,
          },
        },

        variants: {
          variant: {
            default: emptyObject,

            primary: {
              borderColor: tokens.colorPrimary,
              background: `color-mix(in srgb, ${tokens.colorPrimary} 5%, ${tokens.colorSurfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorPrimary} 10%, ${tokens.colorSurfaceContainer})`,
              },
            },

            secondary: {
              borderColor: tokens.colorSecondary,
              background: `color-mix(in srgb, ${tokens.colorSecondary} 5%, ${tokens.colorSurfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorSecondary} 10%, ${tokens.colorSurfaceContainer})`,
              },
            },

            tertiary: {
              borderColor: tokens.colorTertiary,
              background: `color-mix(in srgb, ${tokens.colorTertiary} 5%, ${tokens.colorSurfaceContainer})`,

              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorTertiary} 10%, ${tokens.colorSurfaceContainer})`,
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
              color: tokens.colorOnSurface,
            },

            count: {
              fontSize: '14px',
              fontWeight: 500,
              color: tokens.colorPrimary,
              background: `color-mix(in srgb, ${tokens.colorPrimary} 10%, transparent)`,
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
          border: `2px solid ${tokens.colorOutline}`,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: tokens.transitionFast,

          '&:hover': {
            transform: 'scale(1.1)',
            borderColor: tokens.colorPrimary,
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
              color: tokens.colorOnSurface,
            },
          },

          status: {
            success: {
              background: tokens.colorSuccess,
            },

            warning: {
              background: tokens.colorWarning,
            },

            error: {
              background: tokens.colorError,
            },

            info: {
              background: tokens.colorPrimary,
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
