import { ReadArray } from "./util"

export type Compare<T> = (a: T, b: T) => any

export function simpleEqual<T>(a: T, b: T) {
  return a == b
}

export function simpleEqualsEqual<T extends {
  equals(b: T): boolean
}>(a: T, b: T) {
  return a.equals(b)
}

export function simpleEqualsNotEqual<T extends {
  equals(b: T): boolean
}>(a: T, b: T) {
  return !a.equals(b)
}

export function simpleNotEqual<T>(a: T, b: T) {
  return a != b
}

export function arrayEqual<T>(a1: ReadArray<T>, a2: ReadArray<T>, equal: (x: T, y: T) => boolean = simpleEqual) {
  if (a1 == a2) {
    return true
  }
  const len = a1.length
  if (a2.length == len) {
    for (let i = 0; i < len; i++) {
      if (!equal(a1[i], a2[i])) {
        return false
      }
    }
    return true
  }
  return false
}


/**
 * a1 以 a2 开始
 * @param a1 
 * @param a2 
 * @param equal 
 */
export function arrayStartsWith<T>(a1: ReadArray<T>, a2: ReadArray<T>, equal: (x: T, y: T) => boolean = simpleEqual) {
  if (a1.length < a2.length) {
    return false
  }
  const len = a2.length
  for (let i = 0; i < len; i++) {
    if (!equal(a1[i], a2[i])) {
      return false
    }
  }
  return true
}

/**
 * a1 以 a2 结尾
 * @param a1 
 * @param a2 
 * @param equal 
 */
export function arrayEndsWith<T>(a1: ReadArray<T>, a2: ReadArray<T>, equal: (x: T, y: T) => boolean = simpleEqual) {
  const d = a1.length - a2.length
  if (d < 0) {
    return false
  }
  const len = a2.length
  for (let i = 0; i < len; i++) {
    if (!equal(a1[i + d], a2[i])) {
      return false
    }
  }
  return true
}

/**
 * 两个单值相同,不变更,
 * 两个数组相同,不变更
 * 其它情况,变更
 * @param a 
 * @param b 
 * @returns 
 */
export function arrayNotEqualOrOne<T>(a: T, b: T) {
  if (a == b) {
    return false
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (arrayEqual(a, b, simpleEqual)) {
      return false
    }
  }
  return true
}

export function arrayReduceRight<Ts extends readonly any[]>(vs: Ts, fun: (m: Ts[number], i: number, vs: Ts) => void) {
  for (let i = vs.length - 1; i > -1; i--) {
    const row = vs[i]
    fun(row, i, vs)
  }
}

export function arrayReduceLeft<Ts extends readonly any[]>(vs: Ts, fun: (m: Ts[number], i: number, vs: Ts) => void) {
  vs.forEach(fun as any)
}
export function buildRemoveWhere<T, M>(equal: (m: M, a: T, idx: number) => any) {
  return function (vs: T[], m: M) {
    let count = 0
    arrayReduceRight(vs, function (row, i) {
      if (equal(m, row, i)) {
        vs.splice(i, 1)
        count++
      }
    })
    return count
  }
}
export const removeEqual = buildRemoveWhere(simpleEqual)
export const removeWhere = buildRemoveWhere(function <T>(fun: (v: T, i: number) => any, v: T, i: number) {
  return fun(v, i)
})







export function objectDiffDeleteKey<T>(
  oldProps: Record<string, T>,
  newProps: Record<string, T>,
  each: (key: string) => void
) {
  for (const oldKey in oldProps) {
    if (!(oldKey in newProps)) {
      each(oldKey)
    }
  }
}