import { describe, expect, it } from 'vitest'
import { FlexLayout, LayoutError } from '../src/index'

interface MockChild {
  size: number
  grow?: number
  ignored?: boolean
}

function flex(
  children: MockChild[],
  innerSize: number = 200,
  gap: number = 0,
  directionJustify: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'grow' = 'grow',
  reverse: boolean = false
) {
  const inside = {
    children: () => children,
    innerSize: () => innerSize,
  }
  const convert = {
    index(n: MockChild) {
      return children.indexOf(n)
    },
    grow(n: MockChild) {
      return n.grow ?? 0
    },
    outerSize(n: MockChild) {
      return n.size
    },
    ignore(n: MockChild) {
      return n.ignored ?? false
    },
  }
  return new FlexLayout({ gap, directionJustify, reverse }, inside, convert)
}

describe('FlexLayout ignore', () => {
  it('ignoredChildNotCountedInGrowContainer', () => {
    const layout = flex([
      { size: 10, ignored: true },
      { size: 30 },
      { size: 40 },
    ])
    expect(layout.sizeFromChildren()).toBe(70)
    expect(() => layout.childPosition(0)).toThrow(LayoutError)
    expect(() => layout.childSize(0)).toThrow(LayoutError)
    expect(layout.childPosition(1)).toBe(0)
    expect(layout.childPosition(2)).toBe(30)
    expect(layout.childSize(1)).toBe(30)
    expect(layout.childSize(2)).toBe(40)
  })

  it('ignoredChildSlotIsCurrentLengthInStartContainer', () => {
    const layout = flex(
      [
        { size: 10, ignored: true },
        { size: 30 },
        { size: 40 },
      ],
      200,
      0,
      'start'
    )
    expect(() => layout.childPosition(0)).toThrow(LayoutError)
    expect(() => layout.childSize(0)).toThrow(LayoutError)
    expect(layout.childPosition(1)).toBe(0)
    expect(layout.childPosition(2)).toBe(30)
  })

  it('ignoredGrowChildDoesNotConsumeRemaining', () => {
    const layout = flex(
      [
        { size: 0, grow: 1 },
        { size: 50, grow: 1, ignored: true },
        { size: 0, grow: 1 },
      ],
      200,
      0,
      'start'
    )
    expect(layout.childSize(0)).toBe(100)
    expect(layout.childSize(2)).toBe(100)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
    expect(layout.childPosition(0)).toBe(0)
    expect(layout.childPosition(2)).toBe(100)
  })

  it('ignoredChildDoesNotConsumeGap', () => {
    const layout = flex(
      [
        { size: 30 },
        { size: 20, ignored: true },
        { size: 40 },
      ],
      200,
      10,
      'start'
    )
    expect(layout.childPosition(0)).toBe(0)
    expect(layout.childPosition(2)).toBe(40)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
  })

  it('ignoredChildInCenterContainer', () => {
    const layout = flex(
      [
        { size: 20, ignored: true },
        { size: 30 },
      ],
      200,
      0,
      'center'
    )
    expect(layout.childPosition(1)).toBe(85)
    expect(() => layout.childSize(0)).toThrow(LayoutError)
  })

  it('noIgnoreBehavesAsClassicFlex', () => {
    const layout = flex([{ size: 30 }, { size: 40 }])
    expect(layout.sizeFromChildren()).toBe(70)
    expect(layout.childPosition(0)).toBe(0)
    expect(layout.childPosition(1)).toBe(30)
    expect(layout.childSize(0)).toBe(30)
    expect(layout.childSize(1)).toBe(40)
  })

  it('allChildrenIgnoredInGrowContainer', () => {
    const layout = flex([
      { size: 10, ignored: true },
      { size: 20, ignored: true },
    ])
    expect(layout.sizeFromChildren()).toBe(0)
    expect(() => layout.childPosition(0)).toThrow(LayoutError)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
    expect(() => layout.childSize(0)).toThrow(LayoutError)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
  })
})