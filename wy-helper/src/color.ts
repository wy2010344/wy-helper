import { mixNumber } from '.';

export const GB_MAX_VALUE = 255;
export interface BGColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}
/**
 * 从#36297b6b 转成 "{"red":54,"green":41,"blue":123,"alpha":255}"
 * @param v
 */
export function bgColorfromHex(v: string) {
  const color: BGColor = {
    red: parseInt(v.slice(1, 3), 16),
    green: parseInt(v.slice(3, 5), 16),
    blue: parseInt(v.slice(5, 7), 16),
    alpha: 255,
  };
  if (v.length == 9) {
    //带alpha分量
    color.alpha = parseInt(v.slice(7, 9), 16);
  }
  return color;
}

/**
 * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 #36297b6b
 * @param v
 */
export function hexFromBgColor(v: BGColor) {
  let color = `#${Math.round(v.red).toString(16)}${Math.round(v.green).toString(16)}${Math.round(v.blue).toString(16)}`;
  if (v.alpha != GB_MAX_VALUE) {
    color += v.alpha.toString(16);
  }
  return color;
}

/**
 * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 rgb(54,41,123)
 * @param v
 */
export function rgbFromBgColor(v: BGColor) {
  if (v.alpha != GB_MAX_VALUE) {
    return `rgba(${v.red},${v.green},${v.blue},${v.alpha / GB_MAX_VALUE})`;
  } else {
    return `rgb(${v.red},${v.green},${v.blue})`;
  }
}

export function rgbaFromhHex(hex: string, alpha: number) {
  const color = bgColorfromHex(hex);
  color.alpha = alpha * GB_MAX_VALUE;
  return rgbFromBgColor(color);
}

export function random255() {
  return Math.round(Math.random() * 255);
}
export function randomColor() {
  return hexFromBgColor({
    red: random255(),
    green: random255(),
    blue: random255(),
    alpha: random255(),
  });
}

export function mixColor(a: BGColor, b: BGColor, c: number): BGColor {
  return {
    red: mixNumber(a.red, b.red, c),
    green: mixNumber(a.green, b.green, c),
    blue: mixNumber(a.blue, b.blue, c),
    alpha: mixNumber(a.alpha, b.alpha, c),
  };
}

export function colorEqual(a: BGColor, b: BGColor) {
  return (
    a.alpha == b.alpha &&
    a.green == b.green &&
    a.blue == b.blue &&
    a.red == b.red
  );
}

export function colorAdd(a: BGColor, b: BGColor): BGColor {
  return {
    alpha: a.alpha + b.alpha,
    green: a.green + b.green,
    blue: a.blue + b.blue,
    red: a.red + b.red,
  };
}
