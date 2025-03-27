import { emptyObject } from "./util"

export function createOrProxy<K extends string, V>(keys: K[], create: (v: K) => V): {
  readonly [key in K]: V
} {
  if ('Proxy' in globalThis) {
    const cacheDomMap = new Map<string, any>()
    return new Proxy(emptyObject as any, {
      get(_target, p, _receiver) {
        const oldV = cacheDomMap.get(p as any)
        if (oldV) {
          return oldV
        }
        const newV = create(p as any)
        cacheDomMap.set(p as any, newV)
        return newV
      }
    })
  } else {
    const cacheDom = {} as any
    keys.forEach(function (tag) {
      cacheDom[tag] = create(tag)
    })
    return cacheDom
  }
}


const proxyMapArg = {
  get(target: any, p: string) {
    return target.get(p)
  },
  set(target: any, p: string, newValue: any) {
    if (typeof newValue == 'undefined') {
      target.delete(p)
    } else {
      target.set(p, newValue)
    }
    return true
  },
}
export function proxyMap<T>(map: Map<string | symbol, T>) {
  return new Proxy(map, proxyMapArg) as Record<string | symbol, T>
}