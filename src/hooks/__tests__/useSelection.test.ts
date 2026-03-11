import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelection } from '../useSelection'

describe('useSelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelection())
    expect(result.current.selectedIds).toBeInstanceOf(Set)
    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.count).toBe(0)
  })

  it('should select all items', () => {
    const { result } = renderHook(() => useSelection())
    act(() => { result.current.selectAll(['item-1', 'item-2', 'item-3']) })
    expect(result.current.count).toBe(3)
    expect(result.current.isSelected('item-1')).toBe(true)
  })

  it('should clear selection', () => {
    const { result } = renderHook(() => useSelection())
    act(() => { result.current.selectAll(['item-1', 'item-2']) })
    act(() => { result.current.clearSelection() })
    expect(result.current.count).toBe(0)
    expect(result.current.isSelected('item-1')).toBe(false)
  })

  it('should toggle selection', () => {
    const { result } = renderHook(() => useSelection())
    act(() => { result.current.toggleSelection('item-1') })
    expect(result.current.isSelected('item-1')).toBe(true)
    act(() => { result.current.toggleSelection('item-1') })
    expect(result.current.isSelected('item-1')).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it('should handle duplicate IDs', () => {
    const { result } = renderHook(() => useSelection())
    act(() => { result.current.selectAll(['item-1', 'item-1', 'item-2']) })
    expect(result.current.count).toBe(2)
  })

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useSelection())
    const initialSelectAll = result.current.selectAll
    rerender()
    expect(result.current.selectAll).toBe(initialSelectAll)
  })
})
