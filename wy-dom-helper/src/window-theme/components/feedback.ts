import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// 通知组件
export const notification = createStyle(
  tokens => ({
    notification: {
      base: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.spaceSm,
        padding: tokens.spaceMd,
        background: tokens.colorSurfaceContainer,
        border: `1px solid ${tokens.colorOutline}`,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowMd,
        position: 'relative',
        maxWidth: '400px',
      },
      variants: {
        variant: {
          default: emptyObject,
          success: {
            borderColor: tokens.colorSuccess,
            background: `color-mix(in srgb, ${tokens.colorSuccess} 5%, ${tokens.colorSurfaceContainer})`,
          },
          warning: {
            borderColor: tokens.colorWarning,
            background: `color-mix(in srgb, ${tokens.colorWarning} 5%, ${tokens.colorSurfaceContainer})`,
          },
          error: {
            borderColor: tokens.colorError,
            background: `color-mix(in srgb, ${tokens.colorError} 5%, ${tokens.colorSurfaceContainer})`,
          },
        },
      },
    },
    icon: {
      base: {
        fontSize: '20px',
        flexShrink: 0,
      },
    },
    content: {
      base: {
        flex: 1,
        minWidth: 0,
      },
    },
    title: {
      base: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: tokens.colorOnSurface,
        marginBottom: tokens.spaceXs,
      },
    },
    message: {
      base: {
        margin: 0,
        fontSize: '14px',
        color: tokens.colorOnSurfaceVariant,
        lineHeight: '1.4',
      },
    },
    close: {
      base: {
        position: 'absolute',
        top: tokens.spaceSm,
        right: tokens.spaceSm,
        width: '20px',
        height: '20px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: tokens.colorOnSurfaceVariant,
        '&:hover': {
          background: `color-mix(in srgb, ${tokens.colorOnSurface} 10%, transparent)`,
        },
      },
    },
  }),
  {
    notification: {
      variant: 'default',
    },
    icon: {},
    content: {},
    title: {},
    message: {},
    close: {},
  }
);

// 徽章组件
export const badge = createStyle(
  tokens => {
    return {
      badge: {
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: tokens.radiusSm,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },

        variants: {
          variant: {
            primary: {
              background: tokens.colorPrimary,
              color: tokens.colorOnPrimary,
            },

            success: {
              background: tokens.colorSuccess,
              color: tokens.colorOnSuccess,
            },

            warning: {
              background: tokens.colorWarning,
              color: tokens.colorOnWarning,
            },

            error: {
              background: tokens.colorError,
              color: tokens.colorOnError,
            },

            secondary: {
              background: tokens.colorSecondary,
              color: tokens.colorOnSecondary,
            },
          },

          size: {
            sm: {
              padding: `2px ${tokens.spaceXs}`,
              fontSize: '10px',
            },

            md: emptyObject,

            lg: {
              padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
              fontSize: '14px',
            },
          },
        },
      },
    };
  },
  {
    badge: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// 提示框组件
export const alert = createStyle(
  tokens => ({
    alert: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        padding: tokens.spaceMd,
        borderRadius: tokens.radiusMd,
        border: `1px solid ${tokens.colorOutline}`,
        background: tokens.colorSurfaceContainer,
      },
      variants: {
        variant: {
          info: {
            borderColor: tokens.colorPrimary,
            background: `color-mix(in srgb, ${tokens.colorPrimary} 5%, ${tokens.colorSurfaceContainer})`,
          },
          success: {
            borderColor: tokens.colorSuccess,
            background: `color-mix(in srgb, ${tokens.colorSuccess} 5%, ${tokens.colorSurfaceContainer})`,
          },
          warning: {
            borderColor: tokens.colorWarning,
            background: `color-mix(in srgb, ${tokens.colorWarning} 5%, ${tokens.colorSurfaceContainer})`,
          },
          error: {
            borderColor: tokens.colorError,
            background: `color-mix(in srgb, ${tokens.colorError} 5%, ${tokens.colorSurfaceContainer})`,
          },
        },
      },
    },
    alertIcon: {
      base: {
        fontSize: '18px',
        flexShrink: 0,
      },
    },
    alertText: {
      base: {
        fontSize: '14px',
        color: tokens.colorOnSurface,
        flex: 1,
      },
    },
  }),
  {
    alert: {
      variant: 'info',
    },
    alertIcon: {},
    alertText: {},
  }
);

// 进度条组件
export const progress = createStyle(
  tokens => ({
    progress: {
      base: {
        width: '100%',
        height: '8px',
        background: tokens.colorSurfaceContainerHigh,
        borderRadius: tokens.radiusSm,
        overflow: 'hidden',
        position: 'relative',
      },
      variants: {
        variant: {
          default: emptyObject,
          success: emptyObject,
          warning: emptyObject,
          error: emptyObject,
        },
      },
    },
    bar: {
      base: {
        height: '100%',
        background: tokens.colorPrimary,
        borderRadius: tokens.radiusSm,
        transition: 'width 0.3s ease',
      },
      variants: {
        variant: {
          default: {
            background: tokens.colorPrimary,
          },
          success: {
            background: tokens.colorSuccess,
          },
          warning: {
            background: tokens.colorWarning,
          },
          error: {
            background: tokens.colorError,
          },
        },
      },
    },
  }),
  {
    progress: {
      variant: 'default',
    },
    bar: {
      variant: 'default',
    },
  }
);
