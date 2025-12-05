import { emptyObject } from 'wy-helper';
import { genKeyframe } from '../../stylis';
import { createStyle } from '../util';

// Menu 菜单组件
export const menu = createStyle(
  (tokens, append) => {
    append(menuSlideIn.pack());

    return {
      menu: {
        base: {
          minWidth: '180px',
          background: tokens.colorSurfaceContainer,
          border: `1px solid ${tokens.colorOutlineVariant}`,
          borderRadius: tokens.radiusLg,
          boxShadow: tokens.shadowLg,
          padding: `${tokens.spaceXs} 0`,
          overflow: 'hidden',
          animation: `${menuSlideIn.id} ${tokens.transitionFast} cubic-bezier(0.4, 0, 0.2, 1)`,
        },
        variants: {
          size: {
            sm: {
              minWidth: '140px',
            },
            md: emptyObject,
            lg: {
              minWidth: '220px',
            },
          },
        },
      },
      menuItem: {
        base: {
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spaceSm,
          padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
          background: 'transparent',
          border: 'none',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '14px',
          color: tokens.colorOnSurface,
          transition: tokens.transitionFast,
          position: 'relative',
          '&:hover': {
            background: tokens.colorSurfaceContainerHigh,
          },
          '&:active': {
            background: tokens.colorSurfaceContainerHighest,
          },
        },
        variants: {
          disabled: {
            true: {
              opacity: 0.5,
              cursor: 'not-allowed',
              '&:hover': {
                background: 'transparent',
              },
            },
            false: emptyObject,
          },
          danger: {
            true: {
              color: tokens.colorError,
              '&:hover': {
                background: `color-mix(in srgb, ${tokens.colorError} 10%, ${tokens.colorSurfaceContainer})`,
              },
            },
            false: emptyObject,
          },
          active: {
            true: {
              background: tokens.colorPrimaryContainer,
              color: tokens.colorOnPrimaryContainer,
              fontWeight: 500,
            },
            false: emptyObject,
          },
        },
      },
      menuItemIcon: {
        base: {
          fontSize: '16px',
          width: '20px',
          textAlign: 'center',
          flexShrink: 0,
        },
      },
      menuItemText: {
        base: {
          flex: 1,
        },
      },
      menuItemShortcut: {
        base: {
          fontSize: '12px',
          color: tokens.colorOnSurfaceVariant,
          marginLeft: tokens.spaceLg,
        },
      },
      menuDivider: {
        base: {
          height: '1px',
          background: tokens.colorOutlineVariant,
          margin: `${tokens.spaceXs} 0`,
        },
      },
      menuGroup: {
        base: {
          padding: `${tokens.spaceXs} 0`,
        },
      },
      menuGroupLabel: {
        base: {
          padding: `${tokens.spaceXs} ${tokens.spaceMd}`,
          fontSize: '12px',
          fontWeight: 600,
          color: tokens.colorOnSurfaceVariant,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    };
  },
  {
    menu: {
      size: 'md',
    },
    menuItem: {
      disabled: false,
      danger: false,
      active: false,
    },
    menuItemIcon: {},
    menuItemText: {},
    menuItemShortcut: {},
    menuDivider: {},
    menuGroup: {},
    menuGroupLabel: {},
  }
);

const menuSlideIn = genKeyframe`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;
