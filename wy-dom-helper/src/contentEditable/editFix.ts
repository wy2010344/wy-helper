import { mb, MbRange } from "../mb"

/**
 * 似乎并不能做到对光标的修复
 * 因为选区改变的时候,文字内容并没有改变
 * 并且,input的select事件,只能有选中有效果,只光标移动没有效果
 */
export abstract class EditFixCache<E, V> {
  constructor(
    protected input: E
  ) {
    this.lastValue = this.getValue()
    this.save()
  }
  private lastValue!: V
  //获得值
  abstract getValue(): V
  protected abstract setValue(v: V): void
  //保存上一次的选区信息
  protected abstract save(): void
  //恢复上一次的选区信息
  protected abstract restore(): void
  //是否相等
  protected equal(a: V, b: V) {
    return a === b
  }
  change(value: V) {
    let currentValue = this.getValue()
    if (!this.equal(value, currentValue)) {
      currentValue = value
      this.setValue(value)
      if (this.equal(value, this.lastValue)) {
        this.restore()
        return
      }
    }
    this.lastValue = currentValue
    this.save()
  }
}
export class InputEditCache extends EditFixCache<HTMLInputElement, string> {
  getValue(): string {
    return this.input.value
  }
  protected setValue(v: string): void {
    this.input.value = v
  }
  private lastBegin!: number | null
  private lastEnd!: number | null
  protected save(): void {
    this.lastBegin = this.input.selectionStart
    this.lastEnd = this.input.selectionEnd
  }
  protected restore(): void {
    this.input.selectionStart = this.lastBegin
    this.input.selectionEnd = this.lastEnd
  }

  static from(div: HTMLInputElement) {
    return new InputEditCache(div)
  }
}

abstract class ContentEditableCache<E extends HTMLElement, V> extends EditFixCache<E, V> {
  private range!: MbRange | null
  protected save(): void {
    this.range = mb.DOM.getSelectionRange(this.input)
  }
  protected restore(): void {
    mb.DOM.setSelectionRange(this.input, this.range)
  }
}

export class TextContentEditableFixCache<E extends HTMLElement> extends ContentEditableCache<E, string | null> {
  getValue() {
    return this.input.textContent
  }
  protected setValue(v: string | null): void {
    this.input.textContent = v
  }

  static from<E extends HTMLElement>(div: E) {
    return new TextContentEditableFixCache(div)
  }
}

export class HTMLContentEditableFixCache<E extends HTMLElement> extends ContentEditableCache<E, string> {
  getValue(): string {
    return this.input.innerHTML
  }
  protected setValue(v: string): void {
    this.input.innerHTML = v
  }
  static from<E extends HTMLElement>(div: E) {
    return new HTMLContentEditableFixCache(div)
  }
}
