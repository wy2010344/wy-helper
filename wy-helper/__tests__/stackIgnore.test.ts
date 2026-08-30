import { describe, expect, it } from 'vitest'
import { StackLayout, LayoutError } from '../src/index'

interface MockStackChild {
  size: number
  ignored?: boolean
}

function stack(
  children: MockStackChild[],
  innerSize: number = 100,
  alignItem: 'center' | 'start' | 'end' | 'stretch' = 'center',
  alignFix: boolean = false
) {
  const inside = {
    children: () => children,
    innerSize: () => innerSize,
  }
  const convert = {
    align() {
      return undefined as any
    },
    outerSize(n: MockStackChild) {
      return n.size
    },
    ignore(n: MockStackChild) {
      return n.ignored ?? false
    },
  }
  return new StackLayout({ alignItem, alignFix }, inside, convert)
}

describe('StackLayout ignore', () => {
  it('ignoredChildDoesNotStretchContainerSize', () => {
    const layout = stack(
      [{ size: 40 }, { size: 200, ignored: true }],
      100,
      'stretch'
    )
    expect(layout.sizeFromChildren()).toBe(40)
    expect(layout.childSize(0)).toBe(40)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
  })

  it('ignoredChildPositionIsZero', () => {
    const layout = stack(
      [{ size: 40 }, { size: 200, ignored: true }],
      100,
      'stretch'
    )
    expect(layout.childPosition(0)).toBe(0)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
  })

  it('ignoredChildInCenterContainer', () => {
    const layout = stack([{ size: 40 }, { size: 200, ignored: true }], 100, 'center')
    expect(layout.childPosition(0)).toBe(0)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
  })

  it('ignoredChildWithFixedContainerSize', () => {
    const layout = stack(
      [{ size: 40 }, { size: 200, ignored: true }],
      300,
      'center',
      true
    )
    expect(layout.sizeFromChildren()).toBe(300)
    expect(layout.childPosition(0)).toBe((300 - 40) / 2)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
  })

  it('allChildrenIgnoredSizeIsZero', () => {
    const layout = stack([
      { size: 50, ignored: true },
      { size: 80, ignored: true },
    ])
    expect(layout.sizeFromChildren()).toBe(0)
    expect(() => layout.childSize(0)).toThrow(LayoutError)
    expect(() => layout.childSize(1)).toThrow(LayoutError)
    expect(() => layout.childPosition(0)).toThrow(LayoutError)
    expect(() => layout.childPosition(1)).toThrow(LayoutError)
  })

  it('noIgnoreBehavesAsClassicStack', () => {
    const layout = stack([{ size: 40 }, { size: 80 }], 100, 'stretch')
    expect(layout.sizeFromChildren()).toBe(80)
    expect(layout.childPosition(0)).toBe(0)
    expect(layout.childPosition(1)).toBe(0)
    expect(layout.childSize(0)).toBe(80)
    expect(layout.childSize(1)).toBe(80)
  })
})