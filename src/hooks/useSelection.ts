import { useState, useCallback } from 'react'

interface SelectionState {
  selectedIds: Set<string>
  count: number
}

/**
 * Hook for managing selection state in data views
 *
 * @example
 * ```tsx
 * const { selectedIds, selectAll, clearSelection, toggleSelection, isSelected, count } = useSelection()
 *
 * // Select all items
 * const handleSelectAll = () => {
 *   selectAll(['item-1', 'item-2', 'item-3'])
 * }
 *
 * // Toggle single item
 * const handleToggle = (id: string) => {
 *   toggleSelection(id)
 * }
 *
 * // Check if item is selected
 * const selected = isSelected('item-1')
 *
 * // Clear all selections
 * const handleClear = () => {
 *   clearSelection()
 * }
 * ```
 */
export function useSelection() {
  const [state, setState] = useState<SelectionState>({
    selectedIds: new Set<string>(),
    count: 0,
  })

  /**
   * Select all items from the provided list
   */
  const selectAll = useCallback((ids: string[]) => {
    const newSelectedIds = new Set(ids)
    setState({
      selectedIds: newSelectedIds,
      count: newSelectedIds.size,
    })
  }, [])

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setState({
      selectedIds: new Set<string>(),
      count: 0,
    })
  }, [])

  /**
   * Toggle selection of a single item
   */
  const toggleSelection = useCallback((id: string) => {
    setState((prev) => {
      const newSelectedIds = new Set(prev.selectedIds)
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      return {
        selectedIds: newSelectedIds,
        count: newSelectedIds.size,
      }
    })
  }, [])

  /**
   * Check if an item is selected
   */
  const isSelected = useCallback(
    (id: string): boolean => {
      return state.selectedIds.has(id)
    },
    [state.selectedIds]
  )

  return {
    selectedIds: state.selectedIds,
    count: state.count,
    selectAll,
    clearSelection,
    toggleSelection,
    isSelected,
  }
}
