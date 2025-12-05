import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const navigation = createStyle(
  tokens => {
    return {
      nav: {
        base: {
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spaceXs,
          padding: `0 ${tokens.spaceMd}`,
          background: tokens.colorSurfaceContainer,
          borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
        },
      },
      navItem: {
        base: {
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spaceSm,
          padding: `${tokens.spaceSm} ${tokens.spaceMd}`,
          background: 'transparent',
          border: 'none',
          borderRadius: tokens.radiusMd,
          color: tokens.colorOnSurfaceVariant,
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: `all ${tokens.transitionFast}`,
          textAlign: 'left',
          position: 'relative',
          
          '&:hover:not([disabled])': {
            background: tokens.colorSurfaceContainerHigh,
            color: tokens.colorOnSurface,
          },
        },
        variants: {
          active: {
            true: {
              background: tokens.colorPrimaryContainer,
              color: tokens.colorOnPrimaryContainer,
              fontWeight: 600,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: tokens.colorPrimary,
              },
            },
            false: emptyObject,
          },
        },
      },
      navItemIcon: {
        base: {
          fontSize: '16px',
          width: '20px',
          textAlign: 'center',
        },
      },
      navItemText: {
        base: {
          flex: 1,
          fontWeight: 500,
        },
      },
      breadcrumb: {
        base: {
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spaceXs,
          fontSize: '14px',
        },
        variants: emptyObject,
      },
      breadcrumbItem: {
        base: {
          color: tokens.colorOnSurfaceVariant,
          textDecoration: 'none',
          cursor: 'pointer',

          '&:hover': {
            color: tokens.colorOnSurface,
          },
        },
        variants: {
          current: {
            true: {
              color: tokens.colorOnSurface,
              fontWeight: 500,
            },
            false: emptyObject,
          },
        },
      },
      breadcrumbSeparator: {
        base: {
          color: tokens.colorOnSurfaceVariant,
        },
        variants: emptyObject,
      },
      tabs: {
        base: {
          borderRadius: tokens.radiusLg,
          overflow: 'hidden',
        },
        variants: emptyObject,
      },
      tabsList: {
        base: {
          display: 'flex',
          background: tokens.colorSurfaceContainer,
          borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
        },
        variants: emptyObject,
      },
      tab: {
        base: {
          padding: `${tokens.spaceMd} ${tokens.spaceLg}`,
          background: 'transparent',
          border: 'none',
          color: tokens.colorOnSurfaceVariant,
          cursor: 'pointer',
          transition: `all ${tokens.transitionFast}`,
          borderBottom: '2px solid transparent',

          '&:hover': {
            background: tokens.colorSurfaceContainerHigh,
            color: tokens.colorOnSurface,
          },
        },
        variants: {
          active: {
            true: {
              color: tokens.colorPrimary,
              borderBottomColor: tokens.colorPrimary,
              background: tokens.colorSurfaceContainerHigh,
            },
            false: emptyObject,
          },
        },
      },
      tabsContent: {
        base: {
          padding: tokens.spaceLg,
          background: tokens.colorSurface,
        },
        variants: emptyObject,
      },
    };
  },
  {
    nav: emptyObject,
    navItem: {
      active: false,
    },
    navItemIcon: emptyObject,
    navItemText: emptyObject,
    breadcrumb: emptyObject,
    breadcrumbItem: {
      current: false,
    },
    breadcrumbSeparator: emptyObject,
    tabs: emptyObject,
    tabsList: emptyObject,
    tab: {
      active: false,
    },
    tabsContent: emptyObject,
  }
);
