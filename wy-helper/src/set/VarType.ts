import { AllMayType } from ".";

/**
 * 变量归属类型
 * 自己当然也是某种类型,
 * 但可能是类型下的任何一种,不相交,除非是单值类型
 * 如果是具体单值类型,又不必被VarType包括
 */
export class VarObject {
  constructor(
    public readonly belong: AllMayType,
    public readonly value: Symbol
  ) { }
}


/**
 * 泛型的类型.在表达式中,某个新声明的类型,有它的名字和归属
 * 
 * 
 * 其实相当于在作用域上定义一个类型和名字,这个类型当然有其指定的上级类型
 * 这里当然指一种变量,泛型
 */
export class VarType {
  constructor(
    public readonly belong: AllMayType,
    public readonly value: string
  ) { }
}