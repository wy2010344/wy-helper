import { KVPair } from "../KVPair"
import { Any } from "./Any"
import { toUnion, Union } from "./Union"
import { Fun } from "./Fun"
import { VarObject, VarType } from "./VarType"

/**
 * 类型声明,包含泛型节点
 * 值也是一种类型
 * 集合名本身是一个值,但可用于包含类型,关键在于它在类型位,还是值位.这种规则映射
 * 
 */
export type AllMayType = VarType
  | AllMayObject
  | KVPair<AllMayType>
  | Union<AllMayType>
  | Fun<AllMayType>
/**
 * 类型实例,即所有节点都值化
 */
export type AllMayObject = VarObject
  | String
  | string
  | Number
  | number
  | undefined
  | Any
  | KVPair<AllMayObject>
  | Union<AllMayObject>
  | Fun<AllMayObject>
/**
 * 泛型类型
 * 
 * 泛型的子类型,如
 * (a:Nat)->{
 *  x:a,
 *  y:Nat,
 *  z:a+1
 * },可以把{x:7,y:8,z:8},{x:9,y:8,z:10,f:98}赋值给它
 * 则要在相同场合等量调用
 * (a:Nat)->{
 *  x:a,
 *  y:Nat,
 *  z:a+1
 *  c:String
 * }
 * 是可以的,这个集合更小,即是其子集.
 * 
 * (a:1|2|3)->String|a|[a,a]
 * 则它的子集
 * String|1|2|3|[1,1]|[2,2]|[3,3]
 */
/**
 * 值也是类型,比如String下的值"abc",Number下的值123
 * 类型有几种
 * String/Number/Object/Pair/Union
 * 
 *但由于在联合内部,要区分类型是值还是类型
 *
 *  函数类型也是函数结构,可能计算中转义了
 *  因为有函数有类型注释,将类型注释代入表达式,计算出返回结果类型,这是apply
 *  
 */
