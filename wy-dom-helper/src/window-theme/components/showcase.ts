import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// Showcase 展示容器组件 - 用于组件演示
export const showcase = createStyle(
  tokens => ({
    showcaseContainer: {
      base: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spaceLg,
        padding: tokens.spaceLg,
      },
    },
    showcaseSection: {
      base: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spaceMd,
      },
    },
    showcaseTitle: {
      base: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: tokens.colorOnSurface,
        paddingBottom: tokens.spaceSm,
        borderBottom: `2px solid ${tokens.colorPrimary}`,
      },
      variants: {
        size: {
          sm: {
            fontSize: '14px',
          },
          md: {
            fontSize: '16px',
          },
          lg: {
            fontSize: '18px',
          },
          xl: {
            fontSize: '20px',
          },
        },
      },
    },
    showcaseSubtitle: {
      base: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 500,
        color: tokens.colorOnSurfaceVariant,
        marginBottom: tokens.spaceXs,
      },
    },
    showcaseDemo: {
      base: {
        padding: tokens.spaceLg,
        background: tokens.colorSurfaceContainerLow,
        border: `1px solid ${tokens.colorOutlineVariant}`,
        borderRadius: tokens.radiusLg,
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spaceMd,
        alignItems: 'center',
      },
      variants: {
        variant: {
          default: emptyObject,
          elevated: {
            background: tokens.colorSurfaceContainer,
            boxShadow: tokens.shadowSm,
          },
          outlined: {
            background: 'transparent',
            border: `2px solid ${tokens.colorOutline}`,
          },
        },
        direction: {
          row: {
            flexDirection: 'row',
          },
          column: {
            flexDirection: 'column',
            alignItems: 'flex-start',
          },
        },
      },
    },
    showcaseCode: {
      base: {
        padding: tokens.spaceMd,
        background: tokens.colorInverseSurface,
        color: tokens.colorInverseOnSurface,
        borderRadius: tokens.radiusMd,
        fontSize: '13px',
        fontFamily: 'monospace',
        overflowX: 'auto',
        border: `1px solid ${tokens.colorOutline}`,
      },
    },
    showcaseDescription: {
      base: {
        fontSize: '14px',
        color: tokens.colorOnSurfaceVariant,
        lineHeight: '1.6',
        margin: `${tokens.spaceXs} 0`,
      },
    },
    showcaseDivider: {
      base: {
        height: '1px',
        background: tokens.colorOutlineVariant,
        margin: `${tokens.spaceMd} 0`,
        border: 'none',
      },
    },
    showcaseGrid: {
      base: {
        display: 'grid',
        gap: tokens.spaceMd,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      },
      variants: {
        cols: {
          1: {
            gridTemplateColumns: '1fr',
          },
          2: {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          3: {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
          4: {
            gridTemplateColumns: 'repeat(4, 1fr)',
          },
          auto: {
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          },
        },
      },
    },
    showcaseLabel: {
      base: {
        fontSize: '12px',
        fontWeight: 600,
        color: tokens.colorOnSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: tokens.spaceXs,
      },
    },
  }),
  {
    showcaseContainer: {},
    showcaseSection: {},
    showcaseTitle: {
      size: 'lg',
    },
    showcaseSubtitle: {},
    showcaseDemo: {
      variant: 'default',
      direction: 'row',
    },
    showcaseCode: {},
    showcaseDescription: {},
    showcaseDivider: {},
    showcaseGrid: {
      cols: 'auto',
    },
    showcaseLabel: {},
  }
);
