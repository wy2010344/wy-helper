/**
 * 函数可能不是结构,内部有变量(泛型),代入out表达式
 * 因此计算函数的类型包含,需要arg的合一后,
 *  再代入计算得到返回类型再比较,合一中有一些临时唯一值
 */

import { AllMayType, } from ".";
import { KVPair } from "../KVPair";
import { toUnions, Union } from "./Union";
import { VarType } from "./VarType";
import { TypeScope } from "./include";

export class Fun<T> {
  constructor(
    public readonly arg: T,
    public readonly out: T
  ) { }
}



export function replaceOut(out: AllMayType, scope: TypeScope): AllMayType {
  if (out instanceof KVPair) {
    let m = out as KVPair<AllMayType>
    let rest: KVPair<AllMayType> | undefined = undefined
    while (m) {
      rest = new KVPair(m.key, replaceOut(m.value, scope), rest)
      out = m.rest
    }
    return rest
  } else if (out instanceof Union) {
    return toUnions.apply(undefined, out.list.map(row => {
      return replaceOut(row, scope)
    }) as any)
  } else if (out instanceof Fun) {

  } else if (out instanceof VarType) {
    return scope?.get(out.value)?.value
  }
  return out
}