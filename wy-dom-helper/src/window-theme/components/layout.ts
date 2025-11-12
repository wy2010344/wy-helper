import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

export const layout = createStyle(
  tokens => {
    return {
      layout: {
        base: emptyObject,

        variants: {
          type: {
            container: {
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: `0 ${tokens.spaceMd}`,
            },

            grid: {
              display: 'grid',
              gap: tokens.spaceMd,
            },

            flex: {
              display: 'flex',
            },

            spacing: emptyObject, // 用于间距工具类

            text: emptyObject, // 用于文本工具类
          },

          cols: {
            1: {
              gridTemplateColumns: 'repeat(1, 1fr)',
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
            6: {
              gridTemplateColumns: 'repeat(6, 1fr)',
            },
            12: {
              gridTemplateColumns: 'repeat(12, 1fr)',
            },
          },

          direction: {
            row: {
              flexDirection: 'row',
            },
            col: {
              flexDirection: 'column',
            },
          },

          wrap: {
            true: {
              flexWrap: 'wrap',
            },
            false: emptyObject,
          },

          justify: {
            start: {
              justifyContent: 'flex-start',
            },
            center: {
              justifyContent: 'center',
            },
            end: {
              justifyContent: 'flex-end',
            },
            between: {
              justifyContent: 'space-between',
            },
            around: {
              justifyContent: 'space-around',
            },
            evenly: {
              justifyContent: 'space-evenly',
            },
          },

          items: {
            start: {
              alignItems: 'flex-start',
            },
            center: {
              alignItems: 'center',
            },
            end: {
              alignItems: 'flex-end',
            },
            stretch: {
              alignItems: 'stretch',
            },
            baseline: {
              alignItems: 'baseline',
            },
          },

          gap: {
            xs: {
              gap: tokens.spaceXs,
            },
            sm: {
              gap: tokens.spaceSm,
            },
            md: {
              gap: tokens.spaceMd,
            },
            lg: {
              gap: tokens.spaceLg,
            },
            xl: {
              gap: tokens.spaceXl,
            },
          },

          padding: {
            xs: {
              padding: tokens.spaceXs,
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
            xl: {
              padding: tokens.spaceXl,
            },
          },

          margin: {
            xs: {
              margin: tokens.spaceXs,
            },
            sm: {
              margin: tokens.spaceSm,
            },
            md: {
              margin: tokens.spaceMd,
            },
            lg: {
              margin: tokens.spaceLg,
            },
            xl: {
              margin: tokens.spaceXl,
            },
          },

          size: {
            xs: {
              fontSize: '12px',
            },
            sm: {
              fontSize: '14px',
            },
            base: {
              fontSize: '16px',
            },
            lg: {
              fontSize: '18px',
            },
            xl: {
              fontSize: '20px',
            },
            '2xl': {
              fontSize: '24px',
            },
            '3xl': {
              fontSize: '28px',
            },
          },

          weight: {
            normal: {
              fontWeight: 400,
            },
            medium: {
              fontWeight: 500,
            },
            semibold: {
              fontWeight: 600,
            },
            bold: {
              fontWeight: 700,
            },
          },

          align: {
            left: {
              textAlign: 'left',
            },
            center: {
              textAlign: 'center',
            },
            right: {
              textAlign: 'right',
            },
          },
        },
      },
    };
  },
  {
    layout: {
      type: 'container',
    },
  }
);
