export type Compare<T> = (a: T, b: T) => any

export function simpleEqual<T>(a: T, b: T) {
  return a == b
}

export function simpleNotEqual<T>(a: T, b: T) {
  return a != b
}

export function arrayEqual<T>(a1: readonly T[], a2: readonly T[], equal: (x: T, y: T) => boolean) {
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

export function arrayReduceRight<T>(vs: T[], fun: (m: T, i: number, vs: T[]) => void) {
  for (let i = vs.length - 1; i > -1; i--) {
    const row = vs[i]
    fun(row, i, vs)
  }
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