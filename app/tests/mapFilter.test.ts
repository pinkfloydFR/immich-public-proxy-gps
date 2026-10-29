import { describe, it, expect, beforeEach } from 'vitest'
import { state } from '../src/client/state'
import { computeLayout } from '../src/client/layout'
import type { GalleryItem } from '../src/shared/types'

/*
 * Fork: when the visitor moves the map, `state.mapFilter` holds the indices
 * of the photos whose pin is in view, and the grid lays out only those.
 */

function item (id: string, localDateTime: string): GalleryItem {
  return { id, type: 'IMAGE', previewUrl: '', thumbnailUrl: '', downloadFilename: '', width: 1000, height: 800, localDateTime }
}

describe('map filter in the grid layout', () => {
  beforeEach(() => {
    state.items = [
      item('a', '2025-01-10T10:00:00'),
      item('b', '2025-01-12T10:00:00'),
      item('c', '2025-02-01T10:00:00'),
      item('d', '2025-03-05T10:00:00')
    ]
    state.groupByDate = false
    state.mapFilter = null
  })

  it('lays out every item without a filter', () => {
    const { layout } = computeLayout(1200)
    expect(layout.filter(Boolean).map(l => l.index)).toEqual([0, 1, 2, 3])
  })

  it('lays out only the filtered items, packed from the top', () => {
    state.mapFilter = new Set([1, 3])
    const { layout, totalHeight } = computeLayout(1200)
    expect(layout.filter(Boolean).map(l => l.index)).toEqual([1, 3])
    expect(layout[1].top).toBe(0)
    expect(totalHeight).toBeGreaterThan(0)
  })

  it('drops date groups left empty by the filter', () => {
    state.groupByDate = 'month'
    state.mapFilter = new Set([0, 3])
    expect(computeLayout(1200).headers).toHaveLength(2)
  })

  it('lays out nothing when no pin is in view', () => {
    state.mapFilter = new Set()
    const { layout, totalHeight } = computeLayout(1200)
    expect(layout.filter(Boolean)).toEqual([])
    expect(totalHeight).toBe(0)
  })
})
