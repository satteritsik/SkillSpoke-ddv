/**
 * ViewSet Types and Interfaces
 *
 * ViewSets represent saved view configurations for DynamicDataViewPanel.
 * Similar to saved filters in ConfigManager, but specific to data view layouts.
 *
 * A ViewSet includes:
 * - Layout type (table, board)
 * - Visible columns/fields
 * - Filter expressions
 * - Sort expressions
 * - Grouping configuration (for board lanes)
 */

import type { FilterExpression, SortExpression } from '../adapters/DataAdapter'

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Available layout types for DynamicDataViewPanel.
 */
export type LayoutType = 'table' | 'board'

/**
 * Column configuration for table layout.
 */
export interface ColumnConfig {
  /** Field name from data */
  field: string

  /** Display label (optional, defaults to field name) */
  label?: string

  /** Whether column is visible */
  visible: boolean

  /** Column width (CSS value: '200px', '20%', etc.) */
  width?: string

  /** Display order (lower numbers first) */
  order: number

  /** Whether column is pinned (left or right) */
  pinned?: 'left' | 'right'
}

/**
 * Grouping configuration for board layout.
 */
export interface GroupConfig {
  /** Field to group by (creates lanes) */
  field: string

  /** Display label for grouping */
  label?: string

  /** Order of groups/lanes */
  order?: string[]

  /** Whether to show empty groups */
  showEmpty: boolean

  /** Custom lane colors (field value -> hex color) */
  colors?: Record<string, string>
}

// ============================================================================
// ViewSet Definition
// ============================================================================

/**
 * ViewSet data structure.
 *
 * Contains all configuration needed to restore a saved view state.
 */
export interface ViewSetData {
  /** Layout type */
  layout: LayoutType

  /** Column configurations (for table layout) */
  columns?: ColumnConfig[]

  /** Filter expressions */
  filters?: FilterExpression[]

  /** Sort expressions */
  sorts?: SortExpression[]

  /** Grouping configuration (for board layout) */
  grouping?: GroupConfig

  /** Page size for pagination */
  pageSize?: number

  /** Whether to enable infinite scroll */
  infiniteScroll?: boolean

  /** Custom metadata (extensibility) */
  metadata?: Record<string, any>
}

/**
 * ViewSet with identity and metadata.
 *
 * Similar to Config from ConfigManager but specific to view configurations.
 */
export interface ViewSet {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Whether this is the default ViewSet */
  isDefault: boolean

  /** Whether this ViewSet has unsaved changes */
  isModified?: boolean

  /** ViewSet configuration data */
  data: ViewSetData

  /** When ViewSet was created (ISO 8601) */
  createdAt: string

  /** When ViewSet was last updated (ISO 8601) */
  updatedAt: string

  /** Optional description */
  description?: string

  /** Optional tags for categorization */
  tags?: string[]
}

// ============================================================================
// ViewSet Manager Props
// ============================================================================

/**
 * Props for ViewSetManager component.
 *
 * Manages CRUD operations for ViewSets within a specific data source context.
 */
export interface ViewSetManagerProps {
  /**
   * Data source identifier (e.g., 'opportunities.mainList')
   */
  dataSourceId: string

  /**
   * Currently active ViewSet
   */
  currentViewSet: ViewSet

  /**
   * All available ViewSets for this data source
   */
  viewSets: ViewSet[]

  /**
   * Whether the current ViewSet has unsaved changes
   */
  hasUnsavedChanges: boolean

  /**
   * Callback when a ViewSet is selected
   */
  onViewSetSelect: (viewSet: ViewSet) => void

  /**
   * Callback to save current ViewSet changes
   */
  onSaveChanges: () => Promise<void>

  /**
   * Callback to create a new ViewSet
   */
  onCreateNew: (name: string, description?: string) => Promise<void>

  /**
   * Callback to rename a ViewSet
   */
  onRename: (viewSetId: string, newName: string) => Promise<void>

  /**
   * Callback to delete a ViewSet
   */
  onDelete: (viewSetId: string) => Promise<void>

  /**
   * Callback to reset to default ViewSet
   */
  onResetToDefault: () => void

  /**
   * Callback to duplicate a ViewSet
   */
  onDuplicate?: (viewSetId: string, newName: string) => Promise<void>

  /**
   * Optional callback when ViewSet is imported
   */
  onImport?: (viewSet: ViewSet) => void

  /**
   * Optional className for styling
   */
  className?: string
}

// ============================================================================
// ViewSet Storage
// ============================================================================

/**
 * Storage key pattern for ViewSets.
 *
 * Format: `viewset:{dataSourceId}:{viewSetId}`
 */
export type ViewSetStorageKey = `viewset:${string}:${string}`

/**
 * Storage structure for ViewSets.
 *
 * Used by localStorage/sessionStorage for persistence.
 */
export interface ViewSetStorage {
  /** Version for migration compatibility */
  version: string

  /** Data source identifier */
  dataSourceId: string

  /** All ViewSets for this data source */
  viewSets: ViewSet[]

  /** ID of currently active ViewSet */
  activeViewSetId: string

  /** When storage was last updated (ISO 8601) */
  updatedAt: string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * ViewSet creation input (omits generated fields).
 */
export type CreateViewSetInput = Omit<ViewSet, 'id' | 'createdAt' | 'updatedAt' | 'isModified'>

/**
 * ViewSet update input (only mutable fields).
 */
export type UpdateViewSetInput = Partial<Pick<ViewSet, 'name' | 'description' | 'data' | 'tags'>>

/**
 * ViewSet export format (for import/export functionality).
 */
export interface ViewSetExport {
  /** Export format version */
  version: string

  /** Export type identifier */
  type: 'viewset'

  /** Exported ViewSet data */
  viewSet: ViewSet

  /** When export was created (ISO 8601) */
  exportedAt: string

  /** Optional export metadata */
  metadata?: {
    exportedBy?: string
    sourceApp?: string
    [key: string]: any
  }
}
