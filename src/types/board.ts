/**
 * Board layout types for DynamicDataView Kanban-style board.
 *
 * Defines configuration for rendering records as cards grouped into lanes.
 * Used by BoardLayout component to display data in a horizontal scrollable board.
 */

// ============================================================================
// Card Field Configuration
// ============================================================================

/**
 * Display mode for a field on a card.
 */
export type CardFieldDisplay =
  | "title"       // Primary title (large, bold)
  | "subtitle"    // Secondary info (medium)
  | "badge"       // Colored badge/chip
  | "icon"        // Icon with label
  | "metadata";   // Small text (footer area)

/**
 * Configuration for displaying a field on a board card.
 */
export interface CardFieldConfig {
  /** Field name from the record */
  field: string;

  /** How to display this field on the card */
  display: CardFieldDisplay;

  /** Optional custom label (defaults to field name) */
  label?: string;

  /** Optional icon name for icon display mode */
  icon?: string;

  /** Optional color mapping for badge display mode */
  colorMap?: Record<string, string>;

  /** Display order (lower numbers first) */
  order: number;
}

// ============================================================================
// Lane Configuration
// ============================================================================

/**
 * WIP (Work In Progress) limit configuration for a lane.
 */
export interface WipLimitConfig {
  /** Maximum number of cards allowed in the lane */
  max: number;

  /** Whether to prevent dropping cards when limit is reached */
  enforce: boolean;

  /** Warning threshold (percentage of max) */
  warnAt?: number;
}

/**
 * Configuration for a specific lane value.
 */
export interface LaneConfig {
  /** The value of laneField for this lane */
  value: string;

  /** Custom display label for the lane */
  label?: string;

  /** Optional color for lane header */
  color?: string;

  /** Optional WIP limit */
  wipLimit?: WipLimitConfig;

  /** Display order (lower numbers first) */
  order?: number;
}

// ============================================================================
// Board Layout Configuration
// ============================================================================

/**
 * Complete configuration for board layout rendering.
 *
 * Defines how records are grouped into lanes, what fields appear on cards,
 * and behavior for drag-drop, empty lanes, and virtualization.
 *
 * @example
 * ```typescript
 * const config: BoardLayoutConfig = {
 *   laneField: "status",
 *   cardFields: [
 *     { field: "title", display: "title", order: 0 },
 *     { field: "company", display: "subtitle", order: 1 },
 *     { field: "matchScore", display: "badge", order: 2, colorMap: { high: "#10b981", medium: "#f59e0b", low: "#ef4444" } }
 *   ],
 *   lanes: [
 *     { value: "New", label: "New Opportunities", color: "#3b82f6", order: 0 },
 *     { value: "Applied", label: "Applied", color: "#8b5cf6", order: 1, wipLimit: { max: 10, enforce: false, warnAt: 0.8 } },
 *     { value: "Interview", label: "Interviewing", color: "#f59e0b", order: 2 }
 *   ],
 *   showEmptyLanes: true,
 *   virtualizationThreshold: 100
 * };
 * ```
 */
export interface BoardLayoutConfig {
  /**
   * Field name to group records by (determines lanes).
   * Each unique value of this field becomes a lane.
   *
   * @example "status", "stage", "priority"
   */
  laneField: string;

  /**
   * Fields to display on each card.
   * Defines what information appears and how it's styled.
   */
  cardFields: CardFieldConfig[];

  /**
   * Optional explicit lane configuration.
   * If provided, only these lane values are shown (in specified order).
   * If omitted, lanes are auto-discovered from data.
   */
  lanes?: LaneConfig[];

  /**
   * Whether to show lanes with zero cards.
   * Only applicable when `lanes` is explicitly configured.
   *
   * @default false
   */
  showEmptyLanes?: boolean;

  /**
   * Whether cards are draggable between lanes.
   *
   * @default true
   */
  allowDragDrop?: boolean;

  /**
   * Minimum number of cards in a lane before virtualization is enabled.
   * Improves performance for large lanes by rendering only visible cards.
   *
   * @default 100
   */
  virtualizationThreshold?: number;

  /**
   * Optional custom lane width in pixels.
   *
   * @default 320
   */
  laneWidth?: number;

  /**
   * Optional default color for lanes without explicit config.
   *
   * @default "#6b7280" (gray)
   */
  defaultLaneColor?: string;
}

// ============================================================================
// Runtime Types (Used by Components)
// ============================================================================

/**
 * Resolved lane data at runtime.
 * Combines configuration with actual records.
 */
export interface BoardLane {
  /** Unique identifier for the lane (value of laneField) */
  id: string;

  /** Display label */
  label: string;

  /** Lane color */
  color: string;

  /** Records in this lane */
  records: Record<string, unknown>[];

  /** Optional WIP limit configuration */
  wipLimit?: WipLimitConfig;

  /** Display order */
  order: number;
}

/**
 * Drag-drop event data.
 */
export interface BoardDragEvent {
  /** ID of the record being dragged */
  recordId: string;

  /** Original lane ID (before drag) */
  sourceLaneId: string;

  /** Target lane ID (where dropped) */
  targetLaneId: string;

  /** New value for the laneField */
  newLaneValue: string;
}
