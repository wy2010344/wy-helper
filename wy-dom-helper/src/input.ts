export abstract class ComponentValueCache<E extends HTMLElement, V> {
  constructor(readonly input: E) {}
  abstract get(): V;
  abstract set(v: V): void;
}

export class InputCache extends ComponentValueCache<
  HTMLInputElement | HTMLTextAreaElement,
  string
> {
  get(): string {
    return this.input.value;
  }
  set(v: string): void {
    this.input.value = v;
  }
}

export class InputCheckCache extends ComponentValueCache<
  HTMLInputElement,
  boolean
> {
  get() {
    return this.input.checked;
  }
  set(v: boolean): void {
    this.input.checked = v;
  }
}

export class ContentTextCache extends ComponentValueCache<
  HTMLElement,
  string | null
> {
  get() {
    return this.input.textContent;
  }
  set(v: string | null): void {
    this.input.textContent = v;
    contentDidChange(this.input);
  }
}
export class ContentHTMLCache extends ComponentValueCache<HTMLElement, string> {
  get() {
    return this.input.innerHTML;
  }
  set(v: string): void {
    this.input.innerHTML = v;
    contentDidChange(this.input);
  }
}

//这里倒是跟input类似了,外部设值失败后光标始终到最后
//但禁止设值,光标是不应该变动的..
//仍然使用这个,因为光标可能在文字未变动时变化却观察不到
function contentDidChange(v: HTMLElement) {
  if (document.activeElement == v) {
    //将光标移到最后
    const range = document.createRange();
    range.selectNodeContents(v);
    range.collapse(false); // 让光标移动到 `range` 末尾
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
