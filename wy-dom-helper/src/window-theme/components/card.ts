import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const card = createStyle(
  tokens => ({
    card: {
      base: {
        background: tokens.colorSurfaceContainer,
        border: `1px solid ${tokens.colorOutlineVariant}`,
        borderRadius: tokens.radiusLg,
        padding: tokens.spaceLg,
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.06)`,
        transition: `all ${tokens.transitionNormal}`,
        position: 'relative',
        overflow: 'hidden',
      },
      variants: {
        variant: {
          default: emptyObject,
          elevated: {
            boxShadow: tokens.shadowMd,
            border: 'none',
            background: tokens.colorSurfaceContainerHigh,
          },
          outlined: {
            border: `1px solid ${tokens.colorOutline}`,
            boxShadow: 'none',
          },
          filled: {
            background: tokens.colorSurfaceContainerHighest,
            border: 'none',
            boxShadow: 'none',
          },
        },
        hoverable: {
          true: {
            cursor: 'pointer',
            '&:hover': {
              boxShadow: tokens.shadowMd,
              transform: 'translateY(-2px)',
              borderColor: tokens.colorOutline,
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: `0 1px 3px rgba(0, 0, 0, 0.06)`,
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
        borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
      },
    },
    title: {
      base: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: tokens.colorOnSurface,
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
        color: tokens.colorOnSurface,
        lineHeight: '1.6',
      },
    },
    footer: {
      base: {
        paddingTop: tokens.spaceMd,
        borderTop: `1px solid ${tokens.colorOutlineVariant}`,
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
