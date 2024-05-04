


export interface LinkValue<T> {
  readonly value: T
  /**如果是动态生成,可能要自缓存 */
  getNext(): LinkValue<T> | undefined
}


