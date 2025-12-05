import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// Panel 面板组件 - 用于窗口内容区域
export const panel = createStyle(
  tokens => ({
    panel: {
      base: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        background: tokens.colorSurface,
      },
      variants: {
        padding: {
          none: {
            padding: 0,
          },
          sm: {
            padding: tokens.spaceSm,
          },
          md: {
            padding: tokens.spaceMd,
          },
          lg: {
            padding: tokens.spaceLg,
          },
        },
        scrollable: {
          true: {
            overflowY: 'auto',
            overflowX: 'hidden',
          },
          false: {
            overflow: 'hidden',
          },
        },
      },
    },
    panelHeader: {
      base: {
        padding: tokens.spaceMd,
        borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
        background: tokens.colorSurfaceContainerLow,
      },
    },
    panelTitle: {
      base: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: tokens.colorOnSurface,
      },
    },
    panelBody: {
      base: {
        flex: 1,
        minHeight: 0,
        padding: tokens.spaceMd,
        overflowY: 'auto',
      },
    },
    panelFooter: {
      base: {
        padding: tokens.spaceMd,
        borderTop: `1px solid ${tokens.colorOutlineVariant}`,
        background: tokens.colorSurfaceContainerLow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: tokens.spaceSm,
      },
    },
    panelSection: {
      base: {
        padding: tokens.spaceMd,
        '& + &': {
          borderTop: `1px solid ${tokens.colorOutlineVariant}`,
        },
      },
      variants: {
        variant: {
          default: emptyObject,
          highlighted: {
            background: tokens.colorSurfaceContainerHigh,
          },
        },
      },
    },
  }),
  {
    panel: {
      padding: 'none',
      scrollable: false,
    },
    panelHeader: {},
    panelTitle: {},
    panelBody: {},
    panelFooter: {},
    panelSection: {
      variant: 'default',
    },
  }
);
