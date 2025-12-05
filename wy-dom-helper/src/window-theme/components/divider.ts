import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// 分割线组件
export const divider = createStyle(
  tokens => ({
    divider: {
      base: {
        border: 'none',
        margin: 0,
        flexShrink: 0,
        background: tokens.colorOutlineVariant,
      },
      variants: {
        orientation: {
          horizontal: {
            height: '1px',
            width: '100%',
            margin: `${tokens.spaceMd} 0`,
          },
          vertical: {
            width: '1px',
            height: '100%',
            margin: `0 ${tokens.spaceMd}`,
          },
        },
        variant: {
          solid: emptyObject,
          dashed: {
            backgroundImage: `linear-gradient(to right, ${tokens.colorOutlineVariant} 50%, transparent 50%)`,
            backgroundSize: '8px 1px',
            backgroundRepeat: 'repeat-x',
            background: 'none',
          },
          dotted: {
            backgroundImage: `linear-gradient(to right, ${tokens.colorOutlineVariant} 33%, transparent 33%)`,
            backgroundSize: '4px 1px',
            backgroundRepeat: 'repeat-x',
            background: 'none',
          },
        },
        spacing: {
          none: {
            margin: 0,
          },
          sm: {
            margin: `${tokens.spaceSm} 0`,
          },
          md: {
            margin: `${tokens.spaceMd} 0`,
          },
          lg: {
            margin: `${tokens.spaceLg} 0`,
          },
        },
      },
    },
    dividerWithText: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spaceMd,
        margin: `${tokens.spaceMd} 0`,
        fontSize: '14px',
        color: tokens.colorOnSurfaceVariant,
        '&::before, &::after': {
          content: '""',
          flex: 1,
          height: '1px',
          background: tokens.colorOutlineVariant,
        },
      },
      variants: {
        align: {
          left: {
            '&::before': {
              flex: '0 0 20px',
            },
          },
          center: emptyObject,
          right: {
            '&::after': {
              flex: '0 0 20px',
            },
          },
        },
      },
    },
  }),
  {
    divider: {
      orientation: 'horizontal',
      variant: 'solid',
      spacing: 'md',
    },
    dividerWithText: {
      align: 'center',
    },
  }
);
