import { KVPair } from "../KVPair"
import { Any } from "./Any"
import { toUnion, Union } from "./Union"
import { Fun } from "./Fun"
import { VarObject, VarType } from "./VarType"
import { AllMayObject, AllMayType } from "."

export type TypeScope = KVPair<AllMayObject> | undefined
type ValueScope = KVPair<AllMayObject> | undefined

type IncludeReturn = [TypeScope, ValueScope] | void

function includeUnion(
  t: AllMayType,
  a: Union<AllMayType>,
  typeScope: TypeScope,
  aScope: ValueScope): IncludeReturn {
  const v = a.list.every(v => {
    const m = include(t, v, typeScope, aScope)
    if (m) {
      typeScope = m[0]
      aScope = m[1]
      return true
    }
    return false
  })
  if (v) {
    return [typeScope, aScope]
  }
}

/**
 * 这里有合一来叠加类型,这不太科学吧
 * 应该用声明式去处理类型转移
 * A->A与B->B同构
 * 但字典是否包含?这里面的泛型推导,可能指导最小上级,是用联合的形式
 * @param t 父集合
 * @param a 子集合
 * @param typeScope 
 * @param aScope 
 * @returns 
 */
export function include(
  t: AllMayType,
  a: AllMayType,
  typeScope?: TypeScope,
  aScope?: ValueScope): IncludeReturn {
  if (a instanceof VarType) {
    const def = aScope?.get(a.value)
    if (def) {
      a = def.value
    } else {
      const newA = new VarObject(
        a.belong,
        Symbol(a.value)
      )
      aScope = new KVPair(a.value, newA, aScope)
      a = newA
    }
  }
  if (t == a) {
    //完全相等
    return [typeScope, aScope]
  }
  if (a instanceof VarObject) {
    //变量类型
    return include(t, a.belong, typeScope, aScope)
  }
  if (a instanceof Union) {
    //联合类型的每一个值都属于String
    return includeUnion(t, a, typeScope, aScope)
  }
  if (t == Any) {
    return [typeScope, aScope]
  } else if (t == String) {
    if (typeof a == 'string') {
      return [typeScope, aScope]
    }
    return undefined
  } else if (t == Number) {
    if (typeof a == 'number') {
      return [typeScope, aScope]
    }
    return undefined
  } else if (t instanceof KVPair) {
    if (a instanceof KVPair) {
      let i: KVPair<any> | undefined = t
      while (i) {
        const v = a.get(i.key)
        if (!v) {
          return undefined
        }
        const m = include(i.value, v.value, typeScope, aScope)
        if (m) {
          typeScope = m[0]
          aScope = m[1]
        } else {
          return undefined
        }
        i = i.rest
      }
      return [typeScope, aScope]
    }
    if (typeof a == 'undefined') {
      //空集合
      return [typeScope, aScope]
    }
  } else if (t instanceof Union) {
    const v = t.list.some(v => {
      const m = include(v, a, typeScope, aScope)
      if (m) {
        typeScope = m[0]
        aScope = m[1]
        return true
      }
      return false
    })
    if (v) {
      return [typeScope, aScope]
    }
  } else if (t instanceof Fun) {
    if (a instanceof Fun) {
      /**
       * String->9 可以赋值给 "abc"->Number
       */
      const m = include(a.arg, t.arg, aScope, typeScope)
      if (m) {
        return include(t.out, a.out, m[1], m[0])
      }
    }
  } else if (t instanceof VarObject) {
    if (a instanceof VarObject) {
      //相同的指向
      if (t.value == a.value) {
        return [typeScope, aScope]
      }
      return include(t, a.belong, typeScope, aScope)
    }
  } else if (t instanceof VarType) {
    const m = include(t.belong, a, typeScope, aScope)
    if (m) {
      typeScope = m[0]
      aScope = m[1]
      const def = typeScope?.get(t.value)
      if (def) {
        //已经定义过了,本来需要进行叠加
        typeScope = new KVPair(t.value, toUnion(a, def.value), typeScope)
        return [typeScope, aScope]
        // return include(def.value, a, typeScope, aScope)
      }
      //新增进定义
      typeScope = new KVPair(t.value, a, typeScope)
      return [typeScope, aScope]
    }
  }
  return undefined
}

export function toString(v: AllMayType): string {
  if (v == String) {
    return 'String'
  } else if (v == Number) {
    return 'Number'
  } else if (v == Any) {
    return 'Any'
  } else if (v instanceof KVPair) {
    return `{${inToString(v)}}`
  } else if (v instanceof Union) {
    return `${v.list.map(x => toString(x)).join('|')}`
  } else if (typeof v == 'string') {
    return JSON.stringify(v)
  } else if (v instanceof Fun) {
    return `(${toString(v.arg)})->(${toString(v.out)})`
  } else if (v instanceof VarObject) {
    return ``
  } else if (v instanceof VarType) {

  }
  return v + ""
}

function inToString(o: KVPair<AllMayType>) {
  let ext = '';
  if (o.rest) {
    ext = `,${inToString(o.rest)}`;
  }
  return `${o.key}:${toString(o.value)}${ext}`;
}
