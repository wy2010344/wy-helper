import { genKeyframe } from '../../stylis';
import { createStyle } from '../util';

// 窗口容器 - 只负责窗口本身的样式
export const windowStyle = createStyle(
  (tokens, append) => {

    append(windowAppear.pack())
    append(windowDisappear.pack())
    return {
      container: {
        base: {
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: `color-mix(in srgb, ${tokens.colorSurfaceContainer} 95%, transparent)`,
          border: `1px solid ${tokens.colorOutlineVariant}`,
          borderRadius: tokens.radiusXl,
          boxShadow: tokens.shadowXl,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          willChange: 'transform, box-shadow',
          '&:hover': {
            borderColor: tokens.colorOutline,
            boxShadow: `${tokens.shadowXl}, 0 0 0 1px ${tokens.colorOutlineVariant}`,
          },
        },
        variants: {
          state: {
            appearing: {
              animation: `${windowAppear.id} 0.3s cubic-bezier(0.2, 0, 0, 1) forwards`,
            },
            disappearing: {
              animation:
                `${windowDisappear.id} 0.3s cubic-bezier(0.2, 0, 0, 1) forwards`,
            },
            normal: {},
          },
          variant: {
            default: {},
            primary: {
              background: tokens.colorPrimaryContainer,
              borderColor: tokens.colorPrimary,
              color: tokens.colorOnPrimaryContainer,
            },
            secondary: {
              background: tokens.colorSecondaryContainer,
              borderColor: tokens.colorSecondary,
              color: tokens.colorOnSecondaryContainer,
            },
            tertiary: {
              background: tokens.colorTertiaryContainer,
              borderColor: tokens.colorTertiary,
              color: tokens.colorOnTertiaryContainer,
            },
            error: {
              background: tokens.colorErrorContainer,
              borderColor: tokens.colorError,
              color: tokens.colorOnErrorContainer,
            },
          },
        },
      },
      title: {
        base: {
          position: 'relative',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${tokens.spaceMd}`,
          background: `linear-gradient(180deg, ${tokens.colorSurfaceContainerHigh} 0%, ${tokens.colorSurfaceContainer} 100%)`,
          borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
          borderRadius: `${tokens.radiusXl} ${tokens.radiusXl} 0 0`,
          cursor: 'grab',
          userSelect: 'none',
          transition: `background ${tokens.transitionFast}`,
          '&:active': {
            cursor: 'grabbing',
            background: tokens.colorSurfaceContainerHighest,
          },
          '&:hover': {
            background: tokens.colorSurfaceContainerHighest,
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
          color: tokens.colorOnSurface,
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
            boxShadow: `0 0 0 2px ${tokens.colorPrimary}`,
          },
        },
        variants: {
          variant: {
            success: {
              background: tokens.colorSuccess,
              color: tokens.colorOnSuccess,
              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorSuccess} 90%, ${tokens.colorOnSuccess})`,
              },
            },
            danger: {
              background: tokens.colorError,
              color: tokens.colorOnError,
              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorError} 90%, ${tokens.colorOnError})`,
              },
            },
            neutral: {
              background: tokens.colorSurfaceContainerHighest,
              color: tokens.colorOnSurface,
              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorSurfaceContainerHighest} 90%, ${tokens.colorOnSurface})`,
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
            background: `color-mix(in srgb, ${tokens.colorPrimary} 30%, transparent)`,
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
                background: `linear-gradient(-45deg, transparent 30%, ${tokens.colorOutline} 30%, ${tokens.colorOutline} 35%, transparent 35%, transparent 65%, ${tokens.colorOutline} 65%, ${tokens.colorOutline} 70%, transparent 70%)`,
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
    }
  },
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

const windowAppear = genKeyframe`
from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}
to {
  opacity: 1;
  transform: scale(1) translateY(0);
}
`
const windowDisappear = genKeyframe`
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
`