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
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outline}`,
        borderRadius: tokens.radiusLg,
        boxShadow: tokens.shadowMd,
        position: 'relative',
        maxWidth: '400px',
      },
      variants: {
        variant: {
          default: emptyObject,
          success: {
            borderColor: tokens.success,
            background: `color-mix(in srgb, ${tokens.success} 5%, ${tokens.surfaceContainer})`,
          },
          warning: {
            borderColor: tokens.warning,
            background: `color-mix(in srgb, ${tokens.warning} 5%, ${tokens.surfaceContainer})`,
          },
          error: {
            borderColor: tokens.error,
            background: `color-mix(in srgb, ${tokens.error} 5%, ${tokens.surfaceContainer})`,
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
        color: tokens.onSurface,
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
          background: `color-mix(in srgb, ${tokens.onSurface} 10%, transparent)`,
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
              background: tokens.primary,
              color: tokens.onPrimary,
            },

            success: {
              background: tokens.success,
              color: tokens.onSuccess,
            },

            warning: {
              background: tokens.warning,
              color: tokens.onWarning,
            },

            error: {
              background: tokens.error,
              color: tokens.onError,
            },

            secondary: {
              background: tokens.secondary,
              color: tokens.onSecondary,
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
        border: `1px solid ${tokens.outline}`,
        background: tokens.surfaceContainer,
      },
      variants: {
        variant: {
          info: {
            borderColor: tokens.primary,
            background: `color-mix(in srgb, ${tokens.primary} 5%, ${tokens.surfaceContainer})`,
          },
          success: {
            borderColor: tokens.success,
            background: `color-mix(in srgb, ${tokens.success} 5%, ${tokens.surfaceContainer})`,
          },
          warning: {
            borderColor: tokens.warning,
            background: `color-mix(in srgb, ${tokens.warning} 5%, ${tokens.surfaceContainer})`,
          },
          error: {
            borderColor: tokens.error,
            background: `color-mix(in srgb, ${tokens.error} 5%, ${tokens.surfaceContainer})`,
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
        color: tokens.onSurface,
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
        background: tokens.surfaceContainerHigh,
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
        background: tokens.primary,
        borderRadius: tokens.radiusSm,
        transition: 'width 0.3s ease',
      },
      variants: {
        variant: {
          default: {
            background: tokens.primary,
          },
          success: {
            background: tokens.success,
          },
          warning: {
            background: tokens.warning,
          },
          error: {
            background: tokens.error,
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
