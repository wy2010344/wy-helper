import { Compare, simpleEqual } from './equal';
import { emptyFun, EmptyFun } from './util';
export class ConstraintResult<T> {
  constructor(
    public readonly onSet: (v: T) => void = emptyFun,
    public readonly equal: Compare<T> = simpleEqual
  ) {}
  private _resolved = false;
  reset() {
    this._resolved = false;
  }
  resolved() {
    return this._resolved;
  }
  private value: T = undefined!;
  /**
   * @param v 值
   * @param unresolvedSet 未设置的时候才设置
   * @returns
   */
  set(v: T, unresolvedSet?: boolean) {
    if (this.resolved()) {
      if (unresolvedSet) {
        return;
      }
      if (this.equal(v, this.value)) {
        return;
      }
      throw new ContradictoryError(v, this.value);
    }
    this.value = v;
    this._resolved = true;
    this.onSet(v);
  }
  get() {
    if (this.resolved()) {
      return this.value;
    }
    throw UnsetValueError.instance;
  }
}

export class ContradictoryError<T> extends Error {
  constructor(
    public readonly newValue: T,
    public readonly basedValue: T
  ) {
    super(`矛盾的值${newValue}:${basedValue}`);
  }
}
class UnsetValueError extends Error {
  constructor() {
    super(`未设值`);
  }
  static instance = new UnsetValueError();
}

function doCalculate(calculates: Set<EmptyFun>) {
  const lastSize = calculates.size;
  calculates.forEach(calculate => {
    try {
      calculate();
      calculates.delete(calculate);
    } catch (err) {
      if (!(err instanceof UnsetValueError)) {
        //跳过
        throw err;
      }
    }
  });
  if (calculates.size == lastSize) {
    throw error(`并没有减少计算`);
  }
}
/**
 *
 * Set
 *  可以动态删除元素,
 *  可以动态添加元素,但在下次遍历时才访问到.
 * 就是一个池子里循环在尝试解决问题
 * 依据是最终需要节点都存在
 * 暂时不考虑有多个pool的情况,只有一个pool.
 */
export function constraintEvaluation(
  calculates: Set<EmptyFun>,
  results: Set<ConstraintResult<any>>
) {
  while (results.size) {
    if (calculates.size) {
      doCalculate(calculates);
      results.forEach(result => {
        if (result.resolved()) {
          results.delete(result);
        }
      });
    } else {
      console.log(results);
      throw error(`仍有未填充的数值,但没有待计算的规则`);
    }
  }
  if (calculates.size) {
    while (calculates.size) {
      doCalculate(calculates);
    }
  }
}

function error(msg: string) {
  return msg;
}
