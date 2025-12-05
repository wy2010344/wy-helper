import { emptyObject } from 'wy-helper';
import { createStyle } from '../util';

// Tooltip 提示框组件
export const tooltip = createStyle(
  tokens => ({
    tooltip: {
      base: {
        position: 'absolute',
        padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
        background: tokens.colorInverseSurface,
        color: tokens.colorInverseOnSurface,
        fontSize: '12px',
        borderRadius: tokens.radiusSm,
        boxShadow: tokens.shadowMd,
        whiteSpace: 'nowrap',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: '300px',
        wordWrap: 'break-word',
      },
      variants: {
        placement: {
          top: {
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: `${tokens.colorInverseSurface} transparent transparent transparent`,
            },
          },
          bottom: {
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(8px)',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: `transparent transparent ${tokens.colorInverseSurface} transparent`,
            },
          },
          left: {
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%) translateX(-8px)',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: `transparent transparent transparent ${tokens.colorInverseSurface}`,
            },
          },
          right: {
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%) translateX(8px)',
            '&::after': {
              content: '""',
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: `transparent ${tokens.colorInverseSurface} transparent transparent`,
            },
          },
        },
        variant: {
          default: emptyObject,
          light: {
            background: tokens.colorSurfaceContainerHighest,
            color: tokens.colorOnSurface,
            border: `1px solid ${tokens.colorOutlineVariant}`,
          },
        },
      },
    },
    tooltipWrapper: {
      base: {
        position: 'relative',
        display: 'inline-block',
      },
    },
  }),
  {
    tooltip: {
      placement: 'top',
      variant: 'default',
    },
    tooltipWrapper: {},
  }
);
