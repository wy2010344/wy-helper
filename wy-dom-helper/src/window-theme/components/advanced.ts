import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// 开关组件
export const switchComponent = createStyle(
  tokens => ({
    switch: {
      base: {
        position: 'relative',
        display: 'inline-block',
        width: '44px',
        height: '24px',
        '& input': {
          opacity: 0,
          width: 0,
          height: 0,
        },
      },
      variants: {
        size: {
          sm: {
            width: '36px',
            height: '20px',
          },
          md: emptyObject,
          lg: {
            width: '52px',
            height: '28px',
          },
        },
      },
    },
    slider: {
      base: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: tokens.surfaceContainerHigh,
        border: `1px solid ${tokens.outline}`,
        transition: tokens.transitionNormal,
        borderRadius: '12px',
        '&:before': {
          position: 'absolute',
          content: '""',
          height: '18px',
          width: '18px',
          left: '2px',
          bottom: '2px',
          background: tokens.onSurface,
          transition: tokens.transitionNormal,
          borderRadius: '50%',
          boxShadow: tokens.shadowSm,
        },
      },
      variants: {
        checked: {
          true: {
            background: tokens.primary,
            borderColor: tokens.primary,
            '&:before': {
              background: tokens.onPrimary,
              transform: 'translateX(20px)',
            },
          },
          false: emptyObject,
        },
      },
    },
  }),
  {
    switch: {
      size: 'md',
    },
    slider: {
      checked: false,
    },
  }
);

// 标签组件
export const tag = createStyle(
  tokens => ({
    tag: {
      base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spaceXs,
        padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: tokens.radiusSm,
        border: `1px solid ${tokens.outline}`,
        background: tokens.surfaceContainer,
        color: tokens.onSurface,
        transition: tokens.transitionFast,
      },
      variants: {
        variant: {
          default: emptyObject,
          primary: {
            background: `color-mix(in srgb, ${tokens.primary} 10%, ${tokens.surfaceContainer})`,
            borderColor: tokens.primary,
            color: tokens.primary,
          },
          secondary: {
            background: `color-mix(in srgb, ${tokens.secondary} 10%, ${tokens.surfaceContainer})`,
            borderColor: tokens.secondary,
            color: tokens.secondary,
          },
          success: {
            background: `color-mix(in srgb, ${tokens.success} 10%, ${tokens.surfaceContainer})`,
            borderColor: tokens.success,
            color: tokens.success,
          },
          warning: {
            background: `color-mix(in srgb, ${tokens.warning} 10%, ${tokens.surfaceContainer})`,
            borderColor: tokens.warning,
            color: tokens.warning,
          },
          error: {
            background: `color-mix(in srgb, ${tokens.error} 10%, ${tokens.surfaceContainer})`,
            borderColor: tokens.error,
            color: tokens.error,
          },
        },
      },
    },
    tagClose: {
      base: {
        width: '16px',
        height: '16px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        '&:hover': {
          background: `color-mix(in srgb, ${tokens.onSurface} 10%, transparent)`,
        },
      },
    },
  }),
  {
    tag: {
      variant: 'default',
    },
    tagClose: {},
  }
);

// 头像组件
export const avatar = createStyle(
  tokens => {
    return {
      avatar: {
        base: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: tokens.primary,
          color: tokens.onPrimary,
          fontWeight: 600,
          position: 'relative',
          overflow: 'hidden',
        },

        variants: {
          size: {
            sm: {
              width: '32px',
              height: '32px',
              fontSize: '14px',
            },

            md: {
              width: '40px',
              height: '40px',
              fontSize: '16px',
            },

            lg: {
              width: '56px',
              height: '56px',
              fontSize: '20px',
            },
          },

          status: {
            online: {
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                background: tokens.success,
                borderRadius: '50%',
                border: `2px solid ${tokens.surface}`,
              },
            },

            offline: {
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                background: tokens.outline,
                borderRadius: '50%',
                border: `2px solid ${tokens.surface}`,
              },
            },
          },
        },
      },
    };
  },
  {
    avatar: {
      size: 'md',
    },
  }
);

// 评分组件
export const rating = createStyle(
  tokens => ({
    rating: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceXs,
      },
      variants: {
        size: {
          sm: emptyObject,
          md: emptyObject,
          lg: emptyObject,
        },
      },
    },
    star: {
      base: {
        fontSize: '20px',
        color: tokens.outline,
        cursor: 'pointer',
        transition: tokens.transitionFast,
        '&:hover': {
          transform: 'scale(1.1)',
        },
      },
      variants: {
        filled: {
          true: {
            color: tokens.warning,
          },
          false: emptyObject,
        },
        size: {
          sm: {
            fontSize: '16px',
          },
          md: emptyObject,
          lg: {
            fontSize: '24px',
          },
        },
      },
    },
  }),
  {
    rating: {
      size: 'md',
    },
    star: {
      filled: false,
      size: 'md',
    },
  }
);

// 骨架屏组件
export const skeleton = createStyle(
  tokens => {
    return {
      skeleton: {
        base: {
          background: `linear-gradient(90deg, ${tokens.surfaceContainer} 25%, ${tokens.surfaceContainerHigh} 50%, ${tokens.surfaceContainer} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'skeletonLoading 1.5s infinite',
          borderRadius: tokens.radiusSm,
        },

        variants: {
          variant: {
            title: {
              height: '24px',
              width: '60%',
              marginBottom: tokens.spaceSm,
            },

            text: {
              height: '16px',
              width: '100%',
              marginBottom: tokens.spaceXs,
            },

            avatar: {
              width: '40px',
              height: '40px',
              borderRadius: '50%',
            },

            button: {
              height: '36px',
              width: '80px',
              borderRadius: tokens.radiusMd,
            },

            card: {
              height: '120px',
              width: '100%',
              borderRadius: tokens.radiusLg,
            },
          },
        },
      },
    };
  },
  {
    skeleton: {
      variant: 'text',
    },
  }
);

// 骨架屏动画
export const skeletonAnimations = `
@keyframes skeletonLoading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;
