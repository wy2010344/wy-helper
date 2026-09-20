export interface HTMLWebViewElement extends HTMLElement {}
type Booleanish = boolean;

/**
 * 原生事件 + 精确 target/currentTarget。
 * 事件对象仍是原生的（保留 InputEvent.isComposing、MouseEvent.clientX 等全部字段），
 * 只把 target/currentTarget 从 EventTarget|null 精确到具体标签元素。
 */
export type DomEvent<T, E extends Event = Event> = Omit<
  E,
  'target' | 'currentTarget'
> & {
  target: EventTarget & T;
  currentTarget: T;
};
export type DomEventHandler<T = Element, E extends Event = Event> = (
  e: DomEvent<T, E>
) => void;

export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem'
  | (string & {});
export interface AriaAttributes {
  'aria-activedescendant'?: string | undefined;
  'aria-atomic'?: Booleanish | undefined;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both' | undefined;
  'aria-busy'?: Booleanish | undefined;
  'aria-checked'?: boolean | 'false' | 'mixed' | 'true' | undefined;
  'aria-colcount'?: number | undefined;
  'aria-colindex'?: number | undefined;
  'aria-colspan'?: number | undefined;
  'aria-controls'?: string | undefined;
  'aria-current'?:
    | boolean
    | 'false'
    | 'true'
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time'
    | undefined;
  'aria-describedby'?: string | undefined;
  'aria-details'?: string | undefined;
  'aria-disabled'?: Booleanish | undefined;
  'aria-dropeffect'?:
    | 'none'
    | 'copy'
    | 'execute'
    | 'link'
    | 'move'
    | 'popup'
    | undefined;
  'aria-errormessage'?: string | undefined;
  'aria-expanded'?: Booleanish | undefined;
  'aria-flowto'?: string | undefined;
  'aria-grabbed'?: Booleanish | undefined;
  'aria-haspopup'?:
    | boolean
    | 'false'
    | 'true'
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog'
    | undefined;
  'aria-hidden'?: Booleanish | undefined;
  'aria-invalid'?:
    | boolean
    | 'false'
    | 'true'
    | 'grammar'
    | 'spelling'
    | undefined;
  'aria-keyshortcuts'?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  'aria-level'?: number | undefined;
  'aria-live'?: 'off' | 'assertive' | 'polite' | undefined;
  'aria-modal'?: Booleanish | undefined;
  'aria-multiline'?: Booleanish | undefined;
  'aria-multiselectable'?: Booleanish | undefined;
  'aria-orientation'?: 'horizontal' | 'vertical' | undefined;
  'aria-owns'?: string | undefined;
  'aria-placeholder'?: string | undefined;
  'aria-posinset'?: number | undefined;
  'aria-pressed'?: boolean | 'false' | 'true' | 'mixed' | undefined;
  'aria-readonly'?: Booleanish | undefined;
  'aria-relevant'?:
    | 'additions'
    | 'additions removals'
    | 'additions text'
    | 'all'
    | 'removals'
    | 'removals additions'
    | 'removals text'
    | 'text'
    | 'text additions'
    | 'text removals'
    | undefined;
  'aria-required'?: Booleanish | undefined;
  'aria-roledescription'?: string | undefined;
  'aria-rowcount'?: number | undefined;
  'aria-rowindex'?: number | undefined;
  'aria-rowspan'?: number | undefined;
  'aria-selected'?: Booleanish | undefined;
  'aria-setsize'?: number | undefined;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other' | undefined;
  'aria-valuemax'?: number | undefined;
  'aria-valuemin'?: number | undefined;
  'aria-valuenow'?: number | undefined;
  'aria-valuetext'?: string | undefined;
}

/**
 * 事件属性集。所有处理器直接使用原生事件类型（InputEvent/MouseEvent/...），
 * target/currentTarget 通过 DomEventHandler 精确到元素。
 */
export interface DOMAttributes<T = Element> {
  onCopy?: DomEventHandler<T, ClipboardEvent> | undefined;
  onCopyCapture?: DomEventHandler<T, ClipboardEvent> | undefined;
  onCut?: DomEventHandler<T, ClipboardEvent> | undefined;
  onCutCapture?: DomEventHandler<T, ClipboardEvent> | undefined;
  onPaste?: DomEventHandler<T, ClipboardEvent> | undefined;
  onPasteCapture?: DomEventHandler<T, ClipboardEvent> | undefined;
  onCompositionEnd?: DomEventHandler<T, CompositionEvent> | undefined;
  onCompositionEndCapture?: DomEventHandler<T, CompositionEvent> | undefined;
  onCompositionStart?: DomEventHandler<T, CompositionEvent> | undefined;
  onCompositionStartCapture?: DomEventHandler<T, CompositionEvent> | undefined;
  onCompositionUpdate?: DomEventHandler<T, CompositionEvent> | undefined;
  onCompositionUpdateCapture?: DomEventHandler<T, CompositionEvent> | undefined;
  onFocus?: DomEventHandler<T, FocusEvent> | undefined;
  onFocusCapture?: DomEventHandler<T, FocusEvent> | undefined;
  onBlur?: DomEventHandler<T, FocusEvent> | undefined;
  onBlurCapture?: DomEventHandler<T, FocusEvent> | undefined;
  onBeforeInput?: DomEventHandler<T, InputEvent> | undefined;
  onBeforeInputCapture?: DomEventHandler<T, InputEvent> | undefined;
  onInput?: DomEventHandler<T, InputEvent> | undefined;
  onInputCapture?: DomEventHandler<T, InputEvent> | undefined;
  /**
   * 输入值变化事件（含输入法合成结束），类似 React 的 onChange。
   * 事件对象是原生 InputEvent，可访问 e.target.value 等。
   */
  onValueChange?: DomEventHandler<T, InputEvent> | undefined;
  onReset?: DomEventHandler<T, Event> | undefined;
  onResetCapture?: DomEventHandler<T, Event> | undefined;
  onSubmit?: DomEventHandler<T, Event> | undefined;
  onSubmitCapture?: DomEventHandler<T, Event> | undefined;
  onInvalid?: DomEventHandler<T, Event> | undefined;
  onInvalidCapture?: DomEventHandler<T, Event> | undefined;
  onLoad?: DomEventHandler<T, Event> | undefined;
  onLoadCapture?: DomEventHandler<T, Event> | undefined;
  onError?: DomEventHandler<T, Event> | undefined;
  onErrorCapture?: DomEventHandler<T, Event> | undefined;
  onKeyDown?: DomEventHandler<T, KeyboardEvent> | undefined;
  onKeyDownCapture?: DomEventHandler<T, KeyboardEvent> | undefined;
  onKeyUp?: DomEventHandler<T, KeyboardEvent> | undefined;
  onKeyUpCapture?: DomEventHandler<T, KeyboardEvent> | undefined;
  onAbort?: DomEventHandler<T, Event> | undefined;
  onAbortCapture?: DomEventHandler<T, Event> | undefined;
  onCanPlay?: DomEventHandler<T, Event> | undefined;
  onCanPlayCapture?: DomEventHandler<T, Event> | undefined;
  onCanPlayThrough?: DomEventHandler<T, Event> | undefined;
  onCanPlayThroughCapture?: DomEventHandler<T, Event> | undefined;
  onDurationChange?: DomEventHandler<T, Event> | undefined;
  onDurationChangeCapture?: DomEventHandler<T, Event> | undefined;
  onEmptied?: DomEventHandler<T, Event> | undefined;
  onEmptiedCapture?: DomEventHandler<T, Event> | undefined;
  onEncrypted?: DomEventHandler<T, Event> | undefined;
  onEncryptedCapture?: DomEventHandler<T, Event> | undefined;
  onEnded?: DomEventHandler<T, Event> | undefined;
  onEndedCapture?: DomEventHandler<T, Event> | undefined;
  onLoadedData?: DomEventHandler<T, Event> | undefined;
  onLoadedDataCapture?: DomEventHandler<T, Event> | undefined;
  onLoadedMetadata?: DomEventHandler<T, Event> | undefined;
  onLoadedMetadataCapture?: DomEventHandler<T, Event> | undefined;
  onLoadStart?: DomEventHandler<T, Event> | undefined;
  onLoadStartCapture?: DomEventHandler<T, Event> | undefined;
  onPause?: DomEventHandler<T, Event> | undefined;
  onPauseCapture?: DomEventHandler<T, Event> | undefined;
  onPlay?: DomEventHandler<T, Event> | undefined;
  onPlayCapture?: DomEventHandler<T, Event> | undefined;
  onPlaying?: DomEventHandler<T, Event> | undefined;
  onPlayingCapture?: DomEventHandler<T, Event> | undefined;
  onProgress?: DomEventHandler<T, Event> | undefined;
  onProgressCapture?: DomEventHandler<T, Event> | undefined;
  onRateChange?: DomEventHandler<T, Event> | undefined;
  onRateChangeCapture?: DomEventHandler<T, Event> | undefined;
  onSeeked?: DomEventHandler<T, Event> | undefined;
  onSeekedCapture?: DomEventHandler<T, Event> | undefined;
  onSeeking?: DomEventHandler<T, Event> | undefined;
  onSeekingCapture?: DomEventHandler<T, Event> | undefined;
  onStalled?: DomEventHandler<T, Event> | undefined;
  onStalledCapture?: DomEventHandler<T, Event> | undefined;
  onSuspend?: DomEventHandler<T, Event> | undefined;
  onSuspendCapture?: DomEventHandler<T, Event> | undefined;
  onTimeUpdate?: DomEventHandler<T, Event> | undefined;
  onTimeUpdateCapture?: DomEventHandler<T, Event> | undefined;
  onVolumeChange?: DomEventHandler<T, Event> | undefined;
  onVolumeChangeCapture?: DomEventHandler<T, Event> | undefined;
  onWaiting?: DomEventHandler<T, Event> | undefined;
  onWaitingCapture?: DomEventHandler<T, Event> | undefined;
  onAuxClick?: DomEventHandler<T, MouseEvent> | undefined;
  onAuxClickCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onClick?: DomEventHandler<T, MouseEvent> | undefined;
  onClickCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onContextMenu?: DomEventHandler<T, MouseEvent> | undefined;
  onContextMenuCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onDoubleClick?: DomEventHandler<T, MouseEvent> | undefined;
  onDoubleClickCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onDrag?: DomEventHandler<T, DragEvent> | undefined;
  onDragCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragEnd?: DomEventHandler<T, DragEvent> | undefined;
  onDragEndCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragEnter?: DomEventHandler<T, DragEvent> | undefined;
  onDragEnterCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragExit?: DomEventHandler<T, DragEvent> | undefined;
  onDragExitCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragLeave?: DomEventHandler<T, DragEvent> | undefined;
  onDragLeaveCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragOver?: DomEventHandler<T, DragEvent> | undefined;
  onDragOverCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDragStart?: DomEventHandler<T, DragEvent> | undefined;
  onDragStartCapture?: DomEventHandler<T, DragEvent> | undefined;
  onDrop?: DomEventHandler<T, DragEvent> | undefined;
  onDropCapture?: DomEventHandler<T, DragEvent> | undefined;
  onMouseDown?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseDownCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseEnter?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseLeave?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseMove?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseMoveCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseOut?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseOutCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseOver?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseOverCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseUp?: DomEventHandler<T, MouseEvent> | undefined;
  onMouseUpCapture?: DomEventHandler<T, MouseEvent> | undefined;
  onSelect?: DomEventHandler<T, Event> | undefined;
  onSelectCapture?: DomEventHandler<T, Event> | undefined;
  onTouchCancel?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchCancelCapture?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchEnd?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchEndCapture?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchMove?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchMoveCapture?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchStart?: DomEventHandler<T, TouchEvent> | undefined;
  onTouchStartCapture?: DomEventHandler<T, TouchEvent> | undefined;
  onPointerDown?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerDownCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerMove?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerMoveCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerUp?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerUpCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerCancel?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerCancelCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerEnter?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerLeave?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerOver?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerOverCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerOut?: DomEventHandler<T, PointerEvent> | undefined;
  onPointerOutCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onGotPointerCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onGotPointerCaptureCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onLostPointerCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onLostPointerCaptureCapture?: DomEventHandler<T, PointerEvent> | undefined;
  onScroll?: DomEventHandler<T, Event> | undefined;
  onScrollCapture?: DomEventHandler<T, Event> | undefined;
  onWheel?: DomEventHandler<T, WheelEvent> | undefined;
  onWheelCapture?: DomEventHandler<T, WheelEvent> | undefined;

  onAnimationStart?: DomEventHandler<T, AnimationEvent> | undefined;
  onAnimationStartCapture?: DomEventHandler<T, AnimationEvent> | undefined;
  onAnimationEnd?: DomEventHandler<T, AnimationEvent> | undefined;
  onAnimationEndCapture?: DomEventHandler<T, AnimationEvent> | undefined;
  onAnimationIteration?: DomEventHandler<T, AnimationEvent> | undefined;
  onAnimationIterationCapture?: DomEventHandler<T, AnimationEvent> | undefined;

  onToggle?: DomEventHandler<T, ToggleEvent> | undefined;
  onBeforeToggle?: DomEventHandler<T, ToggleEvent> | undefined;

  onTransitionCancel?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionCancelCapture?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionEnd?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionEndCapture?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionRun?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionRunCapture?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionStart?: DomEventHandler<T, TransitionEvent> | undefined;
  onTransitionStartCapture?: DomEventHandler<T, TransitionEvent> | undefined;
}
export interface DetailedHTMLProps<
  E extends HTMLAttributes,
  T,
  Ev = {},
> {
  attributes: E;
  element: T;
  events: DOMAttributes<T> & Ev;
}

export interface HTMLAttributes {
  accessKey?: string | undefined;
  autoCapitalize?:
    | 'off'
    | 'none'
    | 'on'
    | 'sentences'
    | 'words'
    | 'characters'
    | undefined
    | (string & {});
  autoFocus?: boolean | undefined;
  className?: string | undefined;
  contentEditable?: Booleanish | 'inherit' | 'plaintext-only' | undefined;
  contextMenu?: string | undefined;
  dir?: string | undefined;
  draggable?: Booleanish | undefined;
  enterKeyHint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send'
    | undefined;
  hidden?: boolean | undefined;
  id?: string | undefined;
  lang?: string | undefined;
  nonce?: string | undefined;
  slot?: string | undefined;
  spellcheck?: Booleanish | undefined;
  tabIndex?: number | undefined;
  title?: string | undefined;
  translate?: 'yes' | 'no' | undefined;

  radioGroup?: string | undefined;

  role?: AriaRole | undefined;

  about?: string | undefined;
  content?: string | undefined;
  datatype?: string | undefined;
  inlist?: any;
  prefix?: string | undefined;
  property?: string | undefined;
  rel?: string | undefined;
  resource?: string | undefined;
  rev?: string | undefined;
  typeof?: string | undefined;
  vocab?: string | undefined;

  autoCorrect?: string | undefined;
  autoSave?: string | undefined;
  color?: string | undefined;
  itemProp?: string | undefined;
  itemScope?: boolean | undefined;
  itemType?: string | undefined;
  itemID?: string | undefined;
  itemRef?: string | undefined;
  results?: number | undefined;
  security?: string | undefined;
  unselectable?: 'on' | 'off' | undefined;

  popover?: '' | 'auto' | 'manual' | undefined;
  popoverTargetAction?: 'toggle' | 'show' | 'hide' | undefined;
  popoverTarget?: string | undefined;

  inert?: boolean | undefined;
  inputMode?:
    | 'none'
    | 'text'
    | 'tel'
    | 'url'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'search'
    | undefined;
  is?: string | undefined;
  exportparts?: string | undefined;
  part?: string | undefined;
}
type HTMLAttributeAnchorTarget =
  | '_self'
  | '_blank'
  | '_parent'
  | '_top'
  | (string & {});
export interface AnchorHTMLAttributes extends HTMLAttributes {
  download?: any;
  href?: string | undefined;
  hrefLang?: string | undefined;
  media?: string | undefined;
  ping?: string | undefined;
  rel?: string | undefined;
  target?: HTMLAttributeAnchorTarget | undefined;
  type?: string | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
}
export interface AudioHTMLAttributes extends MediaHTMLAttributes {}
export interface AreaHTMLAttributes extends HTMLAttributes {
  alt?: string | undefined;
  coords?: string | undefined;
  download?: any;
  href?: string | undefined;
  hrefLang?: string | undefined;
  media?: string | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  rel?: string | undefined;
  shape?: string | undefined;
  target?: string | undefined;
}
export interface ButtonHTMLAttributes extends HTMLAttributes {
  autoFocus?: boolean | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  formAction?: string | undefined;
  formEncType?: string | undefined;
  formMethod?: string | undefined;
  formNoValidate?: boolean | undefined;
  formTarget?: string | undefined;
  name?: string | undefined;
  type?: 'submit' | 'reset' | 'button' | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface BlockquoteHTMLAttributes extends HTMLAttributes {
  cite?: string | undefined;
}
export interface BaseHTMLAttributes extends HTMLAttributes {
  href?: string | undefined;
  target?: string | undefined;
}
export interface CanvasHTMLAttributes extends HTMLAttributes {
  height?: number | string | undefined;
  width?: number | string | undefined;
}
export interface ColHTMLAttributes extends HTMLAttributes {
  span?: number | undefined;
  width?: number | string | undefined;
}
export interface ColgroupHTMLAttributes extends HTMLAttributes {
  span?: number | undefined;
}
export interface DataHTMLAttributes extends HTMLAttributes {
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface DetailsHTMLAttributes extends HTMLAttributes {
  open?: boolean | undefined;
}
export interface DelHTMLAttributes extends HTMLAttributes {
  cite?: string | undefined;
  dateTime?: string | undefined;
}
export interface DialogHTMLAttributes extends HTMLAttributes {
  open?: boolean | undefined;
}
export interface EmbedHTMLAttributes extends HTMLAttributes {
  height?: number | string | undefined;
  src?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;
}
export interface FieldsetHTMLAttributes extends HTMLAttributes {
  disabled?: boolean | undefined;
  form?: string | undefined;
  name?: string | undefined;
}
export interface FormHTMLAttributes extends HTMLAttributes {
  acceptCharset?: string | undefined;
  action?: string | undefined;
  autoComplete?: string | undefined;
  encType?: string | undefined;
  method?: string | undefined;
  name?: string | undefined;
  noValidate?: boolean | undefined;
  target?: string | undefined;
}
export interface HtmlHTMLAttributes extends HTMLAttributes {
  manifest?: string | undefined;
}
export interface IframeHTMLAttributes extends HTMLAttributes {
  allow?: string | undefined;
  allowFullScreen?: boolean | undefined;
  allowTransparency?: boolean | undefined;
  frameBorder?: number | string | undefined;
  height?: number | string | undefined;
  loading?: 'eager' | 'lazy' | undefined;
  marginHeight?: number | undefined;
  marginWidth?: number | undefined;
  name?: string | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  sandbox?: string | undefined;
  scrolling?: string | undefined;
  seamless?: boolean | undefined;
  src?: string | undefined;
  srcDoc?: string | undefined;
  width?: number | string | undefined;
}
export interface ImgHTMLAttributes extends HTMLAttributes {
  alt?: string | undefined;
  crossOrigin?: 'anonymous' | 'use-credentials' | '' | undefined;
  decoding?: 'async' | 'auto' | 'sync' | undefined;
  height?: number | string | undefined;
  loading?: 'eager' | 'lazy' | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  sizes?: string | undefined;
  src?: string | undefined;
  srcSet?: string | undefined;
  useMap?: string | undefined;
  width?: number | string | undefined;
}
export interface InsHTMLAttributes extends HTMLAttributes {
  cite?: string | undefined;
  dateTime?: string | undefined;
}
type HTMLInputTypeAttribute =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week'
  | (string & {});
export interface InputHTMLAttributes extends HTMLAttributes {
  accept?: string | undefined;
  alt?: string | undefined;
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  capture?: boolean | 'user' | 'environment' | undefined;
  checked?: boolean | undefined;
  crossOrigin?: string | undefined;
  disabled?: boolean | undefined;
  enterKeyHint?:
    | 'enter'
    | 'done'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send'
    | undefined;
  form?: string | undefined;
  formAction?: string | undefined;
  formEncType?: string | undefined;
  formMethod?: string | undefined;
  formNoValidate?: boolean | undefined;
  formTarget?: string | undefined;
  height?: number | string | undefined;
  list?: string | undefined;
  max?: number | string | undefined;
  maxLength?: number | undefined;
  min?: number | string | undefined;
  minLength?: number | undefined;
  multiple?: boolean | undefined;
  name?: string | undefined;
  pattern?: string | undefined;
  placeholder?: string | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  size?: number | undefined;
  src?: string | undefined;
  step?: number | string | undefined;
  type?: HTMLInputTypeAttribute | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
  width?: number | string | undefined;
}
export interface LabelHTMLAttributes extends HTMLAttributes {
  form?: string | undefined;
  htmlFor?: string | undefined;
}
export interface LiHTMLAttributes extends HTMLAttributes {
  value?: string | ReadonlyArray<string> | number | undefined;
}
type HTMLAttributeReferrerPolicy =
  | ''
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';
export interface LinkHTMLAttributes extends HTMLAttributes {
  as?: string | undefined;
  crossOrigin?: string | undefined;
  href?: string | undefined;
  hrefLang?: string | undefined;
  integrity?: string | undefined;
  media?: string | undefined;
  imageSrcSet?: string | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  rel?: string | undefined;
  sizes?: string | undefined;
  type?: string | undefined;
  charSet?: string | undefined;
}
export interface MapHTMLAttributes extends HTMLAttributes {
  name?: string | undefined;
}
export interface MenuHTMLAttributes extends HTMLAttributes {
  type?: string | undefined;
}
export interface MediaHTMLAttributes extends HTMLAttributes {
  autoPlay?: boolean | undefined;
  controls?: boolean | undefined;
  controlsList?: string | undefined;
  crossOrigin?: string | undefined;
  loop?: boolean | undefined;
  mediaGroup?: string | undefined;
  muted?: boolean | undefined;
  playsInline?: boolean | undefined;
  preload?: string | undefined;
  src?: string | undefined;
}
export interface MetaHTMLAttributes extends HTMLAttributes {
  charSet?: string | undefined;
  content?: string | undefined;
  httpEquiv?: string | undefined;
  name?: string | undefined;
  media?: string | undefined;
}
export interface MeterHTMLAttributes extends HTMLAttributes {
  form?: string | undefined;
  high?: number | undefined;
  low?: number | undefined;
  max?: number | string | undefined;
  min?: number | string | undefined;
  optimum?: number | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface QuoteHTMLAttributes extends HTMLAttributes {
  cite?: string | undefined;
}
export interface ObjectHTMLAttributes extends HTMLAttributes {
  classID?: string | undefined;
  data?: string | undefined;
  form?: string | undefined;
  height?: number | string | undefined;
  name?: string | undefined;
  type?: string | undefined;
  useMap?: string | undefined;
  width?: number | string | undefined;
  wmode?: string | undefined;
}
export interface OlHTMLAttributes extends HTMLAttributes {
  reversed?: boolean | undefined;
  start?: number | undefined;
}
export interface OptgroupHTMLAttributes extends HTMLAttributes {
  disabled?: boolean | undefined;
  label?: string | undefined;
}
export interface OptionHTMLAttributes extends HTMLAttributes {
  disabled?: boolean | undefined;
  label?: string | undefined;
  selected?: boolean | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface OutputHTMLAttributes extends HTMLAttributes {
  form?: string | undefined;
  htmlFor?: string | undefined;
  name?: string | undefined;
}
export interface ParamHTMLAttributes extends HTMLAttributes {
  name?: string | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface ProgressHTMLAttributes extends HTMLAttributes {
  max?: number | string | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface SlotHTMLAttributes extends HTMLAttributes {
  name?: string | undefined;
}
export interface ScriptHTMLAttributes extends HTMLAttributes {
  async?: boolean | undefined;
  blocking?: 'render' | (string & {}) | undefined;
  charSet?: string | undefined;
  crossOrigin?: string | undefined;
  defer?: boolean | undefined;
  integrity?: string | undefined;
  noModule?: boolean | undefined;
  nonce?: string | undefined;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  src?: string | undefined;
  type?: string | undefined;
}
export interface SelectHTMLAttributes extends HTMLAttributes {
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  multiple?: boolean | undefined;
  name?: string | undefined;
  required?: boolean | undefined;
  size?: number | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface SourceHTMLAttributes extends HTMLAttributes {
  height?: number | string | undefined;
  media?: string | undefined;
  sizes?: string | undefined;
  src?: string | undefined;
  srcSet?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;
}
export interface StyleHTMLAttributes extends HTMLAttributes {
  blocking?: 'render' | (string & {}) | undefined;
  media?: string | undefined;
  nonce?: string | undefined;
  scoped?: boolean | undefined;
  type?: string | undefined;
}
export interface TableHTMLAttributes extends HTMLAttributes {
  align?: 'left' | 'center' | 'right' | undefined;
  bgcolor?: string | undefined;
  border?: number | undefined;
  cellPadding?: number | string | undefined;
  cellSpacing?: number | string | undefined;
  frame?: boolean | undefined;
  rules?: 'none' | 'groups' | 'rows' | 'columns' | 'all' | undefined;
  summary?: string | undefined;
  width?: number | string | undefined;
}
export interface TextareaHTMLAttributes extends HTMLAttributes {
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  cols?: number | undefined;
  dirName?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  maxLength?: number | undefined;
  minLength?: number | undefined;
  name?: string | undefined;
  placeholder?: string | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  rows?: number | undefined;
  wrap?: string | undefined;
  value?: string | ReadonlyArray<string> | number | undefined;
}
export interface TdHTMLAttributes extends HTMLAttributes {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined;
  colSpan?: number | undefined;
  headers?: string | undefined;
  rowSpan?: number | undefined;
  scope?: string | undefined;
  abbr?: string | undefined;
  height?: number | string | undefined;
  width?: number | string | undefined;
  valign?: 'top' | 'middle' | 'bottom' | 'baseline' | undefined;
}
export interface ThHTMLAttributes extends HTMLAttributes {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined;
  colSpan?: number | undefined;
  headers?: string | undefined;
  rowSpan?: number | undefined;
  scope?: string | undefined;
  abbr?: string | undefined;
}
export interface TimeHTMLAttributes extends HTMLAttributes {
  dateTime?: string | undefined;
}
export interface TrackHTMLAttributes extends HTMLAttributes {
  default?: boolean | undefined;
  kind?: string | undefined;
  label?: string | undefined;
  src?: string | undefined;
  srcLang?: string | undefined;
}
export interface KeygenHTMLAttributes extends HTMLAttributes {
  autoFocus?: boolean | undefined;
  challenge?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  keyType?: string | undefined;
  keyParams?: string | undefined;
  name?: string | undefined;
}
export interface VideoHTMLAttributes extends MediaHTMLAttributes {
  height?: number | string | undefined;
  playsInline?: boolean | undefined;
  poster?: string | undefined;
  width?: number | string | undefined;
  disablePictureInPicture?: boolean | undefined;
  disableRemotePlayback?: boolean | undefined;
}
export interface WebViewHTMLAttributes extends HTMLAttributes {
  allowFullScreen?: boolean | undefined;
  allowpopups?: boolean | undefined;
  autoFocus?: boolean | undefined;
  autosize?: boolean | undefined;
  blinkfeatures?: string | undefined;
  disableblinkfeatures?: string | undefined;
  disableguestresize?: boolean | undefined;
  disablewebsecurity?: boolean | undefined;
  guestinstance?: string | undefined;
  httpreferrer?: string | undefined;
  nodeintegration?: boolean | undefined;
  partition?: string | undefined;
  plugins?: boolean | undefined;
  preload?: string | undefined;
  src?: string | undefined;
  useragent?: string | undefined;
  webpreferences?: string | undefined;
}
type DomElements = {
  a: DetailedHTMLProps<AnchorHTMLAttributes, HTMLAnchorElement>;
  abbr: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  address: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  area: DetailedHTMLProps<AreaHTMLAttributes, HTMLAreaElement>;
  article: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  aside: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  audio: DetailedHTMLProps<AudioHTMLAttributes, HTMLAudioElement>;
  b: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  base: DetailedHTMLProps<BaseHTMLAttributes, HTMLBaseElement>;
  bdi: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  bdo: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  big: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  blockquote: DetailedHTMLProps<BlockquoteHTMLAttributes, HTMLElement>;
  body: DetailedHTMLProps<HTMLAttributes, HTMLBodyElement>;
  br: DetailedHTMLProps<HTMLAttributes, HTMLBRElement>;
  button: DetailedHTMLProps<ButtonHTMLAttributes, HTMLButtonElement>;
  canvas: DetailedHTMLProps<CanvasHTMLAttributes, HTMLCanvasElement>;
  caption: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  cite: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  code: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  col: DetailedHTMLProps<ColHTMLAttributes, HTMLTableColElement>;
  colgroup: DetailedHTMLProps<ColgroupHTMLAttributes, HTMLTableColElement>;
  data: DetailedHTMLProps<DataHTMLAttributes, HTMLDataElement>;
  datalist: DetailedHTMLProps<HTMLAttributes, HTMLDataListElement>;
  dd: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  del: DetailedHTMLProps<DelHTMLAttributes, HTMLElement>;
  details: DetailedHTMLProps<
    DetailsHTMLAttributes,
    HTMLElement,
    {
      onToggle?: DomEventHandler<HTMLElement, ToggleEvent> | undefined;
    }
  >;
  dfn: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  dialog: DetailedHTMLProps<DialogHTMLAttributes, HTMLDialogElement>;
  div: DetailedHTMLProps<HTMLAttributes, HTMLDivElement>;
  dl: DetailedHTMLProps<HTMLAttributes, HTMLDListElement>;
  dt: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  em: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  embed: DetailedHTMLProps<EmbedHTMLAttributes, HTMLEmbedElement>;
  fieldset: DetailedHTMLProps<FieldsetHTMLAttributes, HTMLFieldSetElement>;
  figcaption: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  figure: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  footer: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  form: DetailedHTMLProps<FormHTMLAttributes, HTMLFormElement>;
  h1: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  h2: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  h3: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  h4: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  h5: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  h6: DetailedHTMLProps<HTMLAttributes, HTMLHeadingElement>;
  head: DetailedHTMLProps<HTMLAttributes, HTMLHeadElement>;
  header: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  hgroup: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  hr: DetailedHTMLProps<HTMLAttributes, HTMLHRElement>;
  html: DetailedHTMLProps<HtmlHTMLAttributes, HTMLHtmlElement>;
  i: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  iframe: DetailedHTMLProps<IframeHTMLAttributes, HTMLIFrameElement>;
  img: DetailedHTMLProps<ImgHTMLAttributes, HTMLImageElement>;
  input: DetailedHTMLProps<InputHTMLAttributes, HTMLInputElement>;
  ins: DetailedHTMLProps<InsHTMLAttributes, HTMLModElement>;
  kbd: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  keygen: DetailedHTMLProps<KeygenHTMLAttributes, HTMLElement>;
  label: DetailedHTMLProps<LabelHTMLAttributes, HTMLLabelElement>;
  legend: DetailedHTMLProps<HTMLAttributes, HTMLLegendElement>;
  li: DetailedHTMLProps<LiHTMLAttributes, HTMLLIElement>;
  link: DetailedHTMLProps<LinkHTMLAttributes, HTMLLinkElement>;
  main: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  map: DetailedHTMLProps<MapHTMLAttributes, HTMLMapElement>;
  mark: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  menu: DetailedHTMLProps<MenuHTMLAttributes, HTMLElement>;
  menuitem: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  meta: DetailedHTMLProps<MetaHTMLAttributes, HTMLMetaElement>;
  meter: DetailedHTMLProps<MeterHTMLAttributes, HTMLElement>;
  nav: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  noindex: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  noscript: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  object: DetailedHTMLProps<ObjectHTMLAttributes, HTMLObjectElement>;
  ol: DetailedHTMLProps<OlHTMLAttributes, HTMLOListElement>;
  optgroup: DetailedHTMLProps<OptgroupHTMLAttributes, HTMLOptGroupElement>;
  option: DetailedHTMLProps<OptionHTMLAttributes, HTMLOptionElement>;
  output: DetailedHTMLProps<OutputHTMLAttributes, HTMLElement>;
  p: DetailedHTMLProps<HTMLAttributes, HTMLParagraphElement>;
  param: DetailedHTMLProps<ParamHTMLAttributes, HTMLParamElement>;
  picture: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  pre: DetailedHTMLProps<HTMLAttributes, HTMLPreElement>;
  progress: DetailedHTMLProps<ProgressHTMLAttributes, HTMLProgressElement>;
  q: DetailedHTMLProps<QuoteHTMLAttributes, HTMLQuoteElement>;
  rp: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  rt: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  ruby: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  s: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  samp: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  slot: DetailedHTMLProps<SlotHTMLAttributes, HTMLSlotElement>;
  script: DetailedHTMLProps<ScriptHTMLAttributes, HTMLScriptElement>;
  section: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  select: DetailedHTMLProps<SelectHTMLAttributes, HTMLSelectElement>;
  small: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  source: DetailedHTMLProps<SourceHTMLAttributes, HTMLSourceElement>;
  span: DetailedHTMLProps<HTMLAttributes, HTMLSpanElement>;
  strong: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  style: DetailedHTMLProps<StyleHTMLAttributes, HTMLStyleElement>;
  sub: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  summary: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  sup: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  table: DetailedHTMLProps<TableHTMLAttributes, HTMLTableElement>;
  template: DetailedHTMLProps<HTMLAttributes, HTMLTemplateElement>;
  tbody: DetailedHTMLProps<HTMLAttributes, HTMLTableSectionElement>;
  td: DetailedHTMLProps<TdHTMLAttributes, HTMLTableDataCellElement>;
  textarea: DetailedHTMLProps<TextareaHTMLAttributes, HTMLTextAreaElement>;
  tfoot: DetailedHTMLProps<HTMLAttributes, HTMLTableSectionElement>;
  th: DetailedHTMLProps<ThHTMLAttributes, HTMLTableHeaderCellElement>;
  thead: DetailedHTMLProps<HTMLAttributes, HTMLTableSectionElement>;
  time: DetailedHTMLProps<TimeHTMLAttributes, HTMLElement>;
  tr: DetailedHTMLProps<HTMLAttributes, HTMLTableRowElement>;
  track: DetailedHTMLProps<TrackHTMLAttributes, HTMLTrackElement>;
  u: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  ul: DetailedHTMLProps<HTMLAttributes, HTMLUListElement>;
  var: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  video: DetailedHTMLProps<VideoHTMLAttributes, HTMLVideoElement>;
  wbr: DetailedHTMLProps<HTMLAttributes, HTMLElement>;
  webview: DetailedHTMLProps<WebViewHTMLAttributes, HTMLWebViewElement>;
};
export type DomElementType = keyof DomElements;
export type DomElement<T extends DomElementType> = DomElements[T]['element'];
export type BDomAttribute<T extends DomElementType> =
  DomElements[T]['attributes'];
export type BDomEvent<T extends DomElementType> = DomElements[T]['events'];

export interface SVGAttributes {
  className?: string | undefined;
  color?: string | undefined;
  height?: number | string | undefined;
  id?: string | undefined;
  lang?: string | undefined;
  max?: number | string | undefined;
  media?: string | undefined;
  method?: string | undefined;
  min?: number | string | undefined;
  name?: string | undefined;
  target?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;
  role?: AriaRole | undefined;
  tabIndex?: number | undefined;
  crossOrigin?: 'anonymous' | 'use-credentials' | '' | undefined;
  accentHeight?: number | string | undefined;
  accumulate?: 'none' | 'sum' | undefined;
  additive?: 'replace' | 'sum' | undefined;
  alignmentBaseline?:
    | 'auto'
    | 'baseline'
    | 'before-edge'
    | 'text-before-edge'
    | 'middle'
    | 'central'
    | 'after-edge'
    | 'text-after-edge'
    | 'ideographic'
    | 'alphabetic'
    | 'hanging'
    | 'mathematical'
    | 'inherit'
    | undefined;
  allowReorder?: 'no' | 'yes' | undefined;
  alphabetic?: number | string | undefined;
  amplitude?: number | string | undefined;
  arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated' | undefined;
  ascent?: number | string | undefined;
  attributeName?: string | undefined;
  attributeType?: string | undefined;
  autoReverse?: Booleanish | undefined;
  azimuth?: number | string | undefined;
  baseFrequency?: number | string | undefined;
  baselineShift?: number | string | undefined;
  baseProfile?: number | string | undefined;
  bbox?: number | string | undefined;
  begin?: number | string | undefined;
  bias?: number | string | undefined;
  by?: number | string | undefined;
  calcMode?: number | string | undefined;
  capHeight?: number | string | undefined;
  clip?: number | string | undefined;
  clipPath?: string | undefined;
  clipPathUnits?: number | string | undefined;
  clipRule?: number | string | undefined;
  colorInterpolation?: number | string | undefined;
  colorInterpolationFilters?:
    | 'auto'
    | 'sRGB'
    | 'linearRGB'
    | 'inherit'
    | undefined;
  colorProfile?: number | string | undefined;
  colorRendering?: number | string | undefined;
  contentScriptType?: number | string | undefined;
  contentStyleType?: number | string | undefined;
  cursor?: number | string | undefined;
  cx?: number | string | undefined;
  cy?: number | string | undefined;
  d?: string | undefined;
  decelerate?: number | string | undefined;
  descent?: number | string | undefined;
  diffuseConstant?: number | string | undefined;
  direction?: number | string | undefined;
  display?: number | string | undefined;
  divisor?: number | string | undefined;
  dominantBaseline?: number | string | undefined;
  dur?: number | string | undefined;
  dx?: number | string | undefined;
  dy?: number | string | undefined;
  edgeMode?: number | string | undefined;
  elevation?: number | string | undefined;
  enableBackground?: number | string | undefined;
  end?: number | string | undefined;
  exponent?: number | string | undefined;
  externalResourcesRequired?: Booleanish | undefined;
  fill?: string | undefined;
  fillOpacity?: number | string | undefined;
  fillRule?: 'nonzero' | 'evenodd' | 'inherit' | undefined;
  filter?: string | undefined;
  filterRes?: number | string | undefined;
  filterUnits?: number | string | undefined;
  floodColor?: number | string | undefined;
  floodOpacity?: number | string | undefined;
  focusable?: Booleanish | 'auto' | undefined;
  fontFamily?: string | undefined;
  fontSize?: number | string | undefined;
  fontSizeAdjust?: number | string | undefined;
  fontStretch?: number | string | undefined;
  fontStyle?: number | string | undefined;
  fontVariant?: number | string | undefined;
  fontWeight?: number | string | undefined;
  format?: number | string | undefined;
  from?: number | string | undefined;
  fx?: number | string | undefined;
  fy?: number | string | undefined;
  g1?: number | string | undefined;
  g2?: number | string | undefined;
  glyphName?: number | string | undefined;
  glyphOrientationHorizontal?: number | string | undefined;
  glyphOrientationVertical?: number | string | undefined;
  glyphRef?: number | string | undefined;
  gradientTransform?: string | undefined;
  gradientUnits?: string | undefined;
  hanging?: number | string | undefined;
  horizAdvX?: number | string | undefined;
  horizOriginX?: number | string | undefined;
  href?: string | undefined;
  ideographic?: number | string | undefined;
  imageRendering?: number | string | undefined;
  in2?: number | string | undefined;
  in?: string | undefined;
  intercept?: number | string | undefined;
  k1?: number | string | undefined;
  k2?: number | string | undefined;
  k3?: number | string | undefined;
  k4?: number | string | undefined;
  k?: number | string | undefined;
  kernelMatrix?: number | string | undefined;
  kernelUnitLength?: number | string | undefined;
  kerning?: number | string | undefined;
  keyPoints?: number | string | undefined;
  keySplines?: number | string | undefined;
  keyTimes?: number | string | undefined;
  lengthAdjust?: number | string | undefined;
  letterSpacing?: number | string | undefined;
  lightingColor?: number | string | undefined;
  limitingConeAngle?: number | string | undefined;
  local?: number | string | undefined;
  markerEnd?: string | undefined;
  markerHeight?: number | string | undefined;
  markerMid?: string | undefined;
  markerStart?: string | undefined;
  markerUnits?: number | string | undefined;
  markerWidth?: number | string | undefined;
  mask?: string | undefined;
  maskContentUnits?: number | string | undefined;
  maskUnits?: number | string | undefined;
  mathematical?: number | string | undefined;
  mode?: number | string | undefined;
  numOctaves?: number | string | undefined;
  offset?: number | string | undefined;
  opacity?: number | string | undefined;
  operator?: number | string | undefined;
  order?: number | string | undefined;
  orient?: number | string | undefined;
  orientation?: number | string | undefined;
  origin?: number | string | undefined;
  overflow?: number | string | undefined;
  overlinePosition?: number | string | undefined;
  overlineThickness?: number | string | undefined;
  paintOrder?: number | string | undefined;
  panose1?: number | string | undefined;
  path?: string | undefined;
  pathLength?: number | string | undefined;
  patternContentUnits?: string | undefined;
  patternTransform?: number | string | undefined;
  patternUnits?: string | undefined;
  pointerEvents?: number | string | undefined;
  points?: string | undefined;
  pointsAtX?: number | string | undefined;
  pointsAtY?: number | string | undefined;
  pointsAtZ?: number | string | undefined;
  preserveAlpha?: Booleanish | undefined;
  preserveAspectRatio?: string | undefined;
  primitiveUnits?: number | string | undefined;
  r?: number | string | undefined;
  radius?: number | string | undefined;
  refX?: number | string | undefined;
  refY?: number | string | undefined;
  renderingIntent?: number | string | undefined;
  repeatCount?: number | string | undefined;
  repeatDur?: number | string | undefined;
  requiredExtensions?: number | string | undefined;
  requiredFeatures?: number | string | undefined;
  restart?: number | string | undefined;
  result?: string | undefined;
  rotate?: number | string | undefined;
  rx?: number | string | undefined;
  ry?: number | string | undefined;
  scale?: number | string | undefined;
  seed?: number | string | undefined;
  shapeRendering?: number | string | undefined;
  slope?: number | string | undefined;
  spacing?: number | string | undefined;
  specularConstant?: number | string | undefined;
  specularExponent?: number | string | undefined;
  speed?: number | string | undefined;
  spreadMethod?: string | undefined;
  startOffset?: number | string | undefined;
  stdDeviation?: number | string | undefined;
  stemh?: number | string | undefined;
  stemv?: number | string | undefined;
  stitchTiles?: number | string | undefined;
  stopColor?: string | undefined;
  stopOpacity?: number | string | undefined;
  strikethroughPosition?: number | string | undefined;
  strikethroughThickness?: number | string | undefined;
  string?: number | string | undefined;
  stroke?: string | undefined;
  strokeDasharray?: string | number | undefined;
  strokeDashoffset?: string | number | undefined;
  strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit' | undefined;
  strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit' | undefined;
  strokeMiterlimit?: number | string | undefined;
  strokeOpacity?: number | string | undefined;
  strokeWidth?: number | string | undefined;
  surfaceScale?: number | string | undefined;
  systemLanguage?: number | string | undefined;
  tableValues?: number | string | undefined;
  targetX?: number | string | undefined;
  targetY?: number | string | undefined;
  textAnchor?: string | undefined;
  textDecoration?: number | string | undefined;
  textLength?: number | string | undefined;
  textRendering?: number | string | undefined;
  to?: number | string | undefined;
  transform?: string | undefined;
  u1?: number | string | undefined;
  u2?: number | string | undefined;
  underlinePosition?: number | string | undefined;
  underlineThickness?: number | string | undefined;
  unicode?: number | string | undefined;
  unicodeBidi?: number | string | undefined;
  unicodeRange?: number | string | undefined;
  unitsPerEm?: number | string | undefined;
  vAlphabetic?: number | string | undefined;
  values?: string | undefined;
  vectorEffect?: number | string | undefined;
  version?: string | undefined;
  vertAdvY?: number | string | undefined;
  vertOriginX?: number | string | undefined;
  vertOriginY?: number | string | undefined;
  vHanging?: number | string | undefined;
  vIdeographic?: number | string | undefined;
  viewBox?: string | undefined;
  viewTarget?: number | string | undefined;
  visibility?: number | string | undefined;
  vMathematical?: number | string | undefined;
  widths?: number | string | undefined;
  wordSpacing?: number | string | undefined;
  writingMode?: number | string | undefined;
  x1?: number | string | undefined;
  x2?: number | string | undefined;
  x?: number | string | undefined;
  xChannelSelector?: string | undefined;
  xHeight?: number | string | undefined;
  xlinkActuate?: string | undefined;
  xlinkArcrole?: string | undefined;
  xlinkHref?: string | undefined;
  xlinkRole?: string | undefined;
  xlinkShow?: string | undefined;
  xlinkTitle?: string | undefined;
  xlinkType?: string | undefined;
  xmlBase?: string | undefined;
  xmlLang?: string | undefined;
  xmlns?: string | undefined;
  xmlnsXlink?: string | undefined;
  xmlSpace?: string | undefined;
  y1?: number | string | undefined;
  y2?: number | string | undefined;
  y?: number | string | undefined;
  yChannelSelector?: string | undefined;
  z?: number | string | undefined;
  zoomAndPan?: string | undefined;
}
export interface SVGProps<T, E = {}, Ev = {}> {
  attributes: E & SVGAttributes;
  element: T;
  events: DOMAttributes<T> & Ev;
}
interface SvgElements {
  svg: SVGProps<SVGSVGElement>;
  animate: SVGProps<SVGElement>;
  animateMotion: SVGProps<SVGElement>;
  animateTransform: SVGProps<SVGElement>;
  circle: SVGProps<SVGCircleElement>;
  clipPath: SVGProps<SVGClipPathElement>;
  defs: SVGProps<SVGDefsElement>;
  desc: SVGProps<SVGDescElement>;
  ellipse: SVGProps<SVGEllipseElement>;
  feBlend: SVGProps<SVGFEBlendElement>;
  feColorMatrix: SVGProps<SVGFEColorMatrixElement>;
  feComponentTransfer: SVGProps<SVGFEComponentTransferElement>;
  feComposite: SVGProps<SVGFECompositeElement>;
  feConvolveMatrix: SVGProps<SVGFEConvolveMatrixElement>;
  feDiffuseLighting: SVGProps<SVGFEDiffuseLightingElement>;
  feDisplacementMap: SVGProps<SVGFEDisplacementMapElement>;
  feDistantLight: SVGProps<SVGFEDistantLightElement>;
  feDropShadow: SVGProps<SVGFEDropShadowElement>;
  feFlood: SVGProps<SVGFEFloodElement>;
  feFuncA: SVGProps<SVGFEFuncAElement>;
  feFuncB: SVGProps<SVGFEFuncBElement>;
  feFuncG: SVGProps<SVGFEFuncGElement>;
  feFuncR: SVGProps<SVGFEFuncRElement>;
  feGaussianBlur: SVGProps<SVGFEGaussianBlurElement>;
  feImage: SVGProps<SVGFEImageElement>;
  feMerge: SVGProps<SVGFEMergeElement>;
  feMergeNode: SVGProps<SVGFEMergeNodeElement>;
  feMorphology: SVGProps<SVGFEMorphologyElement>;
  feOffset: SVGProps<SVGFEOffsetElement>;
  fePointLight: SVGProps<SVGFEPointLightElement>;
  feSpecularLighting: SVGProps<SVGFESpecularLightingElement>;
  feSpotLight: SVGProps<SVGFESpotLightElement>;
  feTile: SVGProps<SVGFETileElement>;
  feTurbulence: SVGProps<SVGFETurbulenceElement>;
  filter: SVGProps<SVGFilterElement>;
  foreignObject: SVGProps<SVGForeignObjectElement>;
  g: SVGProps<SVGGElement>;
  image: SVGProps<SVGImageElement>;
  line: SVGProps<SVGLineElement>;
  linearGradient: SVGProps<SVGLinearGradientElement>;
  marker: SVGProps<SVGMarkerElement>;
  mask: SVGProps<SVGMaskElement>;
  metadata: SVGProps<SVGMetadataElement>;
  mpath: SVGProps<SVGElement>;
  path: SVGProps<SVGPathElement>;
  pattern: SVGProps<SVGPatternElement>;
  polygon: SVGProps<SVGPolygonElement>;
  polyline: SVGProps<SVGPolylineElement>;
  radialGradient: SVGProps<SVGRadialGradientElement>;
  rect: SVGProps<SVGRectElement>;
  set: SVGProps<SVGSetElement>;
  stop: SVGProps<SVGStopElement>;
  switch: SVGProps<SVGSwitchElement>;
  symbol: SVGProps<SVGSymbolElement>;
  text: SVGProps<
    SVGTextElement,
    {
      textContent?: string;
    }
  >;
  textPath: SVGProps<
    SVGTextPathElement,
    {
      textContent?: string;
    }
  >;
  tspan: SVGProps<
    SVGTSpanElement,
    {
      textContent?: string;
    }
  >;
  use: SVGProps<SVGUseElement>;
  view: SVGProps<SVGViewElement>;
  title: SVGProps<SVGTitleElement>;
}
export type SvgElementType = keyof SvgElements;
export type SvgElement<T extends SvgElementType> = SvgElements[T]['element'];
export type BSvgAttribute<T extends SvgElementType> =
  SvgElements[T]['attributes'];
export type BSvgEvent<T extends SvgElementType> = SvgElements[T]['events'];