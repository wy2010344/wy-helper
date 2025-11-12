import { createStyle } from '../util';

// 窗口容器 - 只负责窗口本身的样式
export const windowStyle = createStyle(
  tokens => ({
    container: {
      base: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outlineVariant}`,
        borderRadius: tokens.radiusXl,
        boxShadow: tokens.shadowXl,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: `border-color ${tokens.transitionNormal}, transform ${tokens.transitionNormal}`,
        '&:hover': {
          borderColor: tokens.outline,
          transform: 'translateY(-1px)',
        },
      },
      variants: {
        state: {
          appearing: {
            animation: 'windowAppear 0.3s cubic-bezier(0.2, 0, 0, 1) forwards',
          },
          disappearing: {
            animation:
              'windowDisappear 0.3s cubic-bezier(0.2, 0, 0, 1) forwards',
          },
          normal: {},
        },
        variant: {
          default: {},
          primary: {
            background: tokens.colorPrimaryContainer,
            borderColor: tokens.primary,
            color: tokens.colorOnPrimaryContainer,
          },
          secondary: {
            background: tokens.colorSecondaryContainer,
            borderColor: tokens.secondary,
            color: tokens.colorOnSecondaryContainer,
          },
          tertiary: {
            background: tokens.colorTertiaryContainer,
            borderColor: tokens.tertiary,
            color: tokens.colorOnTertiaryContainer,
          },
          error: {
            background: tokens.colorErrorContainer,
            borderColor: tokens.error,
            color: tokens.colorOnErrorContainer,
          },
        },
      },
    },
    title: {
      base: {
        position: 'relative',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${tokens.spaceMd}`,
        background: tokens.surfaceContainerHigh,
        borderBottom: `1px solid ${tokens.outlineVariant}`,
        borderRadius: `${tokens.radiusLg} ${tokens.radiusLg} 0 0`,
        cursor: 'grab',
        userSelect: 'none',
        '&:active': {
          cursor: 'grabbing',
        },
      },
      variants: {
        size: {
          normal: {},
          compact: {
            height: '32px',
            padding: `0 ${tokens.spaceSm}`,
          },
        },
      },
    },
    titleBarContent: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceSm,
        flex: 1,
        minWidth: 0,
      },
    },
    titleBarIcon: {
      base: {
        fontSize: '18px',
        flexShrink: 0,
      },
      variants: {
        size: {
          small: { fontSize: '14px' },
          normal: { fontSize: '18px' },
          large: { fontSize: '20px' },
        },
      },
    },
    titleBarTitle: {
      base: {
        fontSize: '14px',
        fontWeight: 500,
        color: tokens.onSurface,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      variants: {
        emphasis: {
          normal: {},
          strong: {
            fontWeight: 600,
          },
          subtle: {
            fontWeight: 400,
            opacity: 0.8,
          },
        },
      },
    },
    titleBarControls: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceXs,
      },
    },
    control: {
      base: {
        width: '20px',
        height: '20px',
        border: 'none',
        borderRadius: '50%',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: tokens.transitionFast,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
          transform: 'scale(1.2)',
        },
        '&:focus': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${tokens.primary}`,
        },
      },
      variants: {
        variant: {
          success: {
            background: tokens.success,
            color: tokens.onSuccess,
            '&:hover': {
              background: `color-mix(in srgb, ${tokens.success} 90%, ${tokens.onSuccess})`,
            },
          },
          danger: {
            background: tokens.error,
            color: tokens.onError,
            '&:hover': {
              background: `color-mix(in srgb, ${tokens.error} 90%, ${tokens.onError})`,
            },
          },
          neutral: {
            background: tokens.surfaceContainerHighest,
            color: tokens.onSurface,
            '&:hover': {
              background: `color-mix(in srgb, ${tokens.surfaceContainerHighest} 90%, ${tokens.onSurface})`,
            },
          },
        },
        size: {
          small: {
            width: '20px',
            height: '20px',
            fontSize: '10px',
          },
          normal: {},
          large: {
            width: '28px',
            height: '28px',
            fontSize: '14px',
          },
        },
      },
    },
    resizeHandle: {
      base: {
        position: 'absolute',
        background: 'transparent',
        zIndex: 10,
        '&:hover': {
          background: `color-mix(in srgb, ${tokens.primary} 30%, transparent)`,
        },
      },
      variants: {
        direction: {
          se: {
            bottom: 0,
            right: 0,
            width: '12px',
            height: '12px',
            cursor: 'se-resize',
            borderRadius: `0 0 ${tokens.radiusLg} 0`,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              background: `linear-gradient(-45deg, transparent 30%, ${tokens.outline} 30%, ${tokens.outline} 35%, transparent 35%, transparent 65%, ${tokens.outline} 65%, ${tokens.outline} 70%, transparent 70%)`,
            },
          },
          s: {
            bottom: 0,
            left: 0,
            right: '12px',
            height: '4px',
            cursor: 's-resize',
          },
          e: {
            top: 0,
            right: 0,
            bottom: '12px',
            width: '4px',
            cursor: 'e-resize',
          },
          n: {
            top: 0,
            left: 0,
            right: '12px',
            height: '4px',
            cursor: 'n-resize',
          },
          w: {
            top: 0,
            left: 0,
            bottom: '12px',
            width: '4px',
            cursor: 'w-resize',
          },
          ne: {
            top: 0,
            right: 0,
            width: '12px',
            height: '12px',
            cursor: 'ne-resize',
            borderRadius: `0 ${tokens.radiusLg} 0 0`,
          },
          nw: {
            top: 0,
            left: 0,
            width: '12px',
            height: '12px',
            cursor: 'nw-resize',
            borderRadius: `${tokens.radiusLg} 0 0 0`,
          },
          sw: {
            bottom: 0,
            left: 0,
            width: '12px',
            height: '12px',
            cursor: 'sw-resize',
            borderRadius: `0 0 0 ${tokens.radiusLg}`,
          },
        },
      },
    },
  }),
  {
    container: {
      state: 'normal',
      variant: 'default',
    },
    title: {
      size: 'normal',
    },
    titleBarContent: {},
    titleBarIcon: {
      size: 'normal',
    },
    titleBarTitle: {
      emphasis: 'normal',
    },
    titleBarControls: {},
    control: { variant: 'neutral', size: 'normal' },
    resizeHandle: { direction: 'se' },
  }
);

// 添加动画关键帧到全局样式
export const windowAnimations = `
@keyframes windowAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes windowDisappear {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
}
`;
