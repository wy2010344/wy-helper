import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const card = createStyle(
  tokens => ({
    card: {
      base: {
        background: tokens.surfaceContainer,
        border: `1px solid ${tokens.outline}`,
        borderRadius: tokens.radiusLg,
        padding: tokens.spaceLg,
        boxShadow: tokens.shadowSm,
        transition: tokens.transitionNormal,
        position: 'relative',
        overflow: 'hidden',
      },
      variants: {
        variant: {
          default: emptyObject,
          elevated: {
            boxShadow: tokens.shadowMd,
            border: 'none',
          },
          outlined: {
            border: `2px solid ${tokens.outline}`,
            boxShadow: 'none',
          },
        },
        hoverable: {
          true: {
            cursor: 'pointer',
            '&:hover': {
              boxShadow: tokens.shadowMd,
              transform: 'translateY(-2px)',
            },
          },
          false: emptyObject,
        },
      },
    },
    header: {
      base: {
        marginBottom: tokens.spaceMd,
        paddingBottom: tokens.spaceMd,
        borderBottom: `1px solid ${tokens.outlineVariant}`,
      },
    },
    title: {
      base: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: tokens.onSurface,
        lineHeight: '1.4',
      },
    },
    subtitle: {
      base: {
        margin: `${tokens.spaceXs} 0 0 0`,
        fontSize: '14px',
        color: tokens.colorOnSurfaceVariant,
        lineHeight: '1.4',
      },
    },
    body: {
      base: {
        marginBottom: tokens.spaceMd,
        color: tokens.onSurface,
        lineHeight: '1.6',
      },
    },
    footer: {
      base: {
        paddingTop: tokens.spaceMd,
        borderTop: `1px solid ${tokens.outlineVariant}`,
      },
    },
  }),
  {
    card: {
      variant: 'default',
      hoverable: false,
    },
    header: {},
    title: {},
    subtitle: {},
    body: {},
    footer: {},
  }
);
