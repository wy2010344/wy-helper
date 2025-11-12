import { createGetId } from 'wy-helper';
import { createStyle, CSSProperties } from './util';
import { createBodyStyleTag } from './stylis';

export type NestedCSSObject = CSSProperties & {
  [key in string]: NestedCSSObject;
};
/**
 * 将 CSS 对象转换为字符串
 */
export function cssObjectToString(
  obj: NestedCSSObject,
  selector: string
): string {
  const rules: string[] = [];
  const nestedRules: string[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      // 处理嵌套规则
      if (key.startsWith('&')) {
        // 伪类或伪元素
        const nestedSelector = selector + key.slice(1);
        nestedRules.push(
          cssObjectToString(value as NestedCSSObject, nestedSelector)
        );
      } else if (key.startsWith('@')) {
        // 媒体查询等 at-rules
        nestedRules.push(
          `${key} { ${cssObjectToString(value as NestedCSSObject, selector)} }`
        );
      } else {
        // 子选择器
        const nestedSelector = `${selector} ${key}`;
        nestedRules.push(
          cssObjectToString(value as NestedCSSObject, nestedSelector)
        );
      }
    } else {
      // 普通 CSS 属性
      const cssProperty = camelToKebab(key);
      const cssValue = formatValue(key, value);
      rules.push(`  ${cssProperty}: ${cssValue};`);
    }
  });

  const mainRule =
    rules.length > 0 ? `${selector} {\n${rules.join('\n')}\n}` : '';
  return [mainRule, ...nestedRules].filter(Boolean).join('\n');
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function formatValue(property: string, value: any): string {
  if (typeof value === 'number') {
    // 需要单位的属性
    const needsUnit = [
      'width',
      'height',
      'margin',
      'padding',
      'top',
      'left',
      'right',
      'bottom',
      'fontSize',
      'lineHeight',
      'borderRadius',
      'borderWidth',
      'gap',
    ];
    if (
      needsUnit.some(prop =>
        property.toLowerCase().includes(prop.toLowerCase())
      )
    ) {
      return `${value}px`;
    }
  }

  return String(value);
}

// CVA 风格的配置类型
export interface StyleConfig {
  base?: Record<string, any>;
  variants?: Record<string, Record<string, Record<string, any>>>;
  compoundVariants?: Array<{
    [key: string]: any;
    style: Record<string, any>;
  }>;
  // defaultVariants?: Record<string, any>;
}
export interface StyleConfigMap {
  [key: string]: StyleConfig;
}

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;
// 样式函数的参数类型

export type StyleVariants<T extends StyleConfig> = {
  [K in keyof T['variants']]?: StringToBoolean<keyof T['variants'][K]>;
} & {
  className?: string;
};

export type StyleVariantsMap<T extends StyleConfigMap> = {
  [K in keyof T]: StyleVariants<T[K]>; //(key:K,arg:T[K])=>string
}; //[keyof T];

const uid = createGetId({
  min: 0,
});
class StoreEach<Tokens> {
  private count = 0;
  constructor(
    readonly prefix: string,
    readonly cls: string,
    readonly id: string,
    private readonly style: HTMLStyleElement,
    private readonly map: Map<any, StoreEach<Tokens>>,
    private readonly theme: Tokens
  ) {}
  //在类似useEffect里调用
  effect() {
    this.count++;
    return () => {
      this.count--;
      if (!this.count) {
        this.style.remove();
        this.map.delete(this.theme);
      }
    };
  }
}

export class CreateStyle<T extends StyleConfigMap, Tokens> {
  private map = new Map<any, StoreEach<Tokens>>();
  private selfUID = createGetId({
    min: 0,
  });
  readonly id = uid();
  constructor(
    // readonly define: T
    // readonly name: string,
    private readonly config: (v: Tokens) => T,
    private readonly defaultStyle: StyleVariantsMap<T>
  ) {}
  getId(prefix: string, tokens: Tokens) {
    const map = this.map;
    const old = map.get(tokens);
    if (old) {
      return old;
    } else {
      const style = createStyle();
      const id = this.selfUID();
      const styleId = `cls-${this.id}-${id}`;
      style.id = styleId;
      const data = new StoreEach(prefix, styleId, id, style, map, tokens);
      const vs: string[] = [];
      const outs = this.config(tokens);
      for (const name in outs) {
        const out = outs[name];
        if (out.base) {
          vs.push(cssObjectToString(out.base, `.${data.cls}.${prefix}${name}`));
        }
        for (const variant in out.variants) {
          const object = out.variants[variant];
          for (const key in object) {
            const o = object[key];
            vs.push(
              cssObjectToString(
                o,
                `.${data.cls}.${prefix}${name}-${variant}-${key}`
              )
            );
          }
        }
        out.compoundVariants?.forEach(function (item) {
          const cls: string[] = [`.${data.cls}`];
          for (const key in item) {
            if (key != 'style') {
              cls.push(`.${prefix}${name}-${key}-${item[key]}`);
            }
          }
          vs.push(cssObjectToString(item.style, cls.join('')));
        });
      }
      style.innerHTML = vs.join('\n');
      map.set(tokens, data);
      return data;
    }
  }
  getClassName<K extends keyof T & string>(
    id: StoreEach<Tokens>,
    name: K,
    a: Partial<StyleVariantsMap<T>[K]>
  ) {
    const vs: string[] = [id.cls, `${id.prefix}${name}`, a?.className ?? ''];
    a = {
      ...this.defaultStyle[name],
      ...a,
    };
    for (const key in a) {
      if (key != 'className') {
        vs.push(
          `${id.prefix}${name}-${key}-${a[key as keyof typeof a] as string}`
        );
      }
    }
    return vs.join(' ');
  }
}
