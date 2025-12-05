import { emptyObject } from 'wy-helper';
import { genKeyframe } from '../../stylis';
import { createStyle } from '../util';

// Modal 模态框组件
export const modal = createStyle(
  (tokens, append) => {
    append(modalFadeIn.pack());
    append(modalFadeOut.pack());
    append(modalSlideIn.pack());
    append(modalSlideOut.pack());

    return {
      overlay: {
        base: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: tokens.spaceLg,
        },
        variants: {
          state: {
            entering: {
              animation: `${modalFadeIn.id} ${tokens.transitionNormal} forwards`,
            },
            exiting: {
              animation: `${modalFadeOut.id} ${tokens.transitionNormal} forwards`,
            },
            normal: {},
          },
        },
      },
      modal: {
        base: {
          position: 'relative',
          background: tokens.colorSurfaceContainer,
          borderRadius: tokens.radiusXl,
          boxShadow: tokens.shadowXl,
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        variants: {
          size: {
            sm: {
              width: '400px',
            },
            md: {
              width: '600px',
            },
            lg: {
              width: '800px',
            },
            xl: {
              width: '1000px',
            },
            full: {
              width: '90vw',
              height: '90vh',
            },
          },
          state: {
            entering: {
              animation: `${modalSlideIn.id} ${tokens.transitionNormal} forwards`,
            },
            exiting: {
              animation: `${modalSlideOut.id} ${tokens.transitionNormal} forwards`,
            },
            normal: {},
          },
        },
      },
      header: {
        base: {
          padding: tokens.spaceLg,
          borderBottom: `1px solid ${tokens.colorOutlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(180deg, ${tokens.colorSurfaceContainerHigh} 0%, ${tokens.colorSurfaceContainer} 100%)`,
        },
      },
      title: {
        base: {
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: tokens.colorOnSurface,
        },
      },
      closeButton: {
        base: {
          width: '32px',
          height: '32px',
          border: 'none',
          background: 'transparent',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          color: tokens.colorOnSurfaceVariant,
          transition: tokens.transitionFast,
          '&:hover': {
            background: tokens.colorSurfaceContainerHighest,
            color: tokens.colorOnSurface,
          },
        },
      },
      body: {
        base: {
          padding: tokens.spaceLg,
          flex: 1,
          overflowY: 'auto',
          color: tokens.colorOnSurface,
        },
      },
      footer: {
        base: {
          padding: tokens.spaceLg,
          borderTop: `1px solid ${tokens.colorOutlineVariant}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: tokens.spaceSm,
          background: tokens.colorSurfaceContainerLow,
        },
      },
    };
  },
  {
    overlay: {
      state: 'normal',
    },
    modal: {
      size: 'md',
      state: 'normal',
    },
    header: {},
    title: {},
    closeButton: {},
    body: {},
    footer: {},
  }
);

const modalFadeIn = genKeyframe`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const modalFadeOut = genKeyframe`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const modalSlideIn = genKeyframe`
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const modalSlideOut = genKeyframe`
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
`;
