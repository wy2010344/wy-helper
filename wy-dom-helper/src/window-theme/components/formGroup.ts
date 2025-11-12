import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const formGroup = createStyle(
  tokens => {
    return {
      formGroup: {
        base: {
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spaceXs,
          marginBottom: tokens.spaceMd,
        },

        variants: {
          type: {
            group: emptyObject, // 使用 base 样式

            label: {
              fontSize: '14px',
              fontWeight: '500',
              color: tokens.onSurface,
              marginBottom: tokens.spaceXs,
              display: 'block',
              flexDirection: 'row',
              gap: 0,
              margin: `0 0 ${tokens.spaceXs} 0`,
            },

            helper: {
              fontSize: '12px',
              color: tokens.colorOnSurfaceVariant,
              marginTop: tokens.spaceXs,
              display: 'block',
              flexDirection: 'row',
              gap: 0,
              margin: `${tokens.spaceXs} 0 0 0`,
            },

            error: {
              fontSize: '12px',
              color: tokens.error,
              marginTop: tokens.spaceXs,
              display: 'block',
              flexDirection: 'row',
              gap: 0,
              margin: `${tokens.spaceXs} 0 0 0`,
            },
          },
        },
      },
    };
  },
  {
    formGroup: {
      type: 'group',
    },
  }
);
