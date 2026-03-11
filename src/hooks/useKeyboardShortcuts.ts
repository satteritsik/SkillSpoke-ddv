import { useEffect } from 'react'

interface KeyboardShortcutsConfig {
  /**
   * Callback triggered when Ctrl/Cmd+A is pressed
   */
  onSelectAll: () => void
  /**
   * Callback triggered when Escape is pressed
   */
  onClearSelection: () => void
  /**
   * Whether keyboard shortcuts are enabled
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook for handling keyboard shortcuts in data views
 *
 * Listens for:
 * - Ctrl/Cmd+A: Select all items
 * - Escape: Clear selection
 *
 * @example
 * ```tsx
 * const { selectAll, clearSelection } = useSelection()
 *
 * useKeyboardShortcuts({
 *   onSelectAll: () => selectAll(allItemIds),
 *   onClearSelection: clearSelection,
 *   enabled: true,
 * })
 * ```
 */
export function useKeyboardShortcuts({
  onSelectAll,
  onClearSelection,
  enabled = true,
}: KeyboardShortcutsConfig): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+A (Mac) or Ctrl+A (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault() // Prevent default browser select all behavior
        onSelectAll()
        return
      }

      // Check for Escape key
      if (event.key === 'Escape') {
        event.preventDefault()
        onClearSelection()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onSelectAll, onClearSelection])
}
