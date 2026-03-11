/**
 * Core DataAdapter interface for DynamicDataView platform.
 * 
 * This is the ONLY required contract for integrating any data source.
 * Per Section 19.1 of COMPREHENSIVE_IMPLEMENTATION_PLAN.md.
 * 
 * Design Goal: Minimal integration surface - typically 10-50 lines to implement.
 */

// ============================================================================
// Core Query Types
// ============================================================================

/**
 * Filter operator types supported by DynamicDataView.
 */
export type FilterOperator =
  | "eq"          // Equal
  | "neq"         // Not equal
  | "gt"          // Greater than
  | "gte"         // Greater than or equal
  | "lt"          // Less than
  | "lte"         // Less than or equal
  | "contains"    // String contains
  | "startsWith"  // String starts with
  | "endsWith"    // String ends with
  | "in"          // Value in array
  | "notIn"       // Value not in array
  | "between";    // Value between two values

/**
 * Single filter expression.
 */
export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Sort direction.
 */
export type SortDirection = "asc" | "desc";

/**
 * Single sort expression.
 */
export interface SortExpression {
  field: string;
  direction: SortDirection;
}

/**
 * Query parameters for fetching data.
 */
export interface DataQuery {
  /** Maximum number of records to return */
  limit: number;
  
  /** Offset for pagination (0-based) */
  offset: number;
  
  /** Filter expressions (AND logic between filters) */
  filters?: FilterExpression[];
  
  /** Sort expressions (applied in order) */
  sorts?: SortExpression[];
  
  /** Full-text search query (adapter-specific implementation) */
  search?: string;
  
  /** Specific fields to return (undefined = all fields) */
  fields?: string[];
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Inferred field type from data inspection.
 */
export type InferredType = 
  | "string" 
  | "number" 
  | "boolean" 
  | "date" 
  | "datetime" 
  | "enum" 
  | "id" 
  | "unknown";

/**
 * Discovered field metadata from data inspection.
 */
export interface DiscoveredField {
  /** Field name as it appears in data */
  name: string;
  
  /** Type inferred from sample values */
  inferredType: InferredType;
  
  /** Sample non-null values (for enum detection, etc.) */
  sampleValues: any[];
  
  /** Whether field has null values in sample */
  nullable: boolean;
  
  /** Number of distinct values in sample (for enum detection) */
  cardinality: number;
  
  /** Optional display label (defaults to name) */
  label?: string;
  
  /** Optional description */
  description?: string;
}

/**
 * Discovered schema from data inspection.
 */
export interface DiscoveredSchema {
  /** All discovered fields */
  fields: DiscoveredField[];
  
  /** Total records sampled for discovery */
  sampleSize: number;
  
  /** When schema was discovered */
  discoveredAt: string; // ISO 8601 timestamp
}

/**
 * Data fetch result.
 */
export interface DataResult<T = Record<string, any>> {
  /** Array of data rows/records */
  rows: T[];
  
  /** Total count of matching records (if available) */
  total?: number;
  
  /** Whether more records are available (for infinite scroll) */
  hasMore: boolean;
  
  /** Discovered schema from this result (optional, cached after first fetch) */
  discoveredSchema?: DiscoveredSchema;
  
  /** Optional metadata from adapter */
  metadata?: Record<string, any>;
}

// ============================================================================
// Schema Introspection (Optional)
// ============================================================================

/**
 * Schema hint provided by adapter (optional alternative to discovery).
 */
export interface SchemaHint {
  /** Known fields with explicit types */
  fields: Array<{
    name: string;
    type: InferredType;
    label?: string;
    description?: string;
    enumValues?: any[]; // For enum types
    nullable?: boolean;
  }>;
  
  /** Whether this hint is authoritative (true) or just a suggestion (false) */
  authoritative: boolean;
}

// ============================================================================
// Mutation Support (Optional)
// ============================================================================

/**
 * Mutation operation types.
 */
export type MutationType = "create" | "update" | "delete";

/**
 * Single mutation operation.
 */
export interface MutationOp<T = Record<string, any>> {
  type: MutationType;
  
  /** ID(s) of record(s) to mutate (for update/delete) */
  ids?: string[];
  
  /** New/updated data (for create/update) */
  data?: T;
  
  /** Optional field-level partial update */
  fields?: Partial<T>;
}

/**
 * Mutation result.
 */
export interface MutationResult<T = Record<string, any>> {
  /** Whether mutation succeeded */
  success: boolean;
  
  /** Affected record(s) */
  affected?: T[];
  
  /** Error message if failed */
  error?: string;
  
  /** Validation errors by field */
  validationErrors?: Record<string, string>;
}

// ============================================================================
// Core DataAdapter Interface
// ============================================================================

/**
 * Minimal interface that any data source must implement.
 * 
 * ONLY `fetchData` is required. All other methods are optional enhancements.
 * 
 * Design Philosophy:
 * - Adapters can be as simple as 10-20 lines
 * - Discovery happens automatically from returned data
 * - Introspection and mutation are opt-in features
 * 
 * @example Minimal REST adapter (20 lines)
 * ```typescript
 * export function createRESTAdapter(baseUrl: string): DataAdapter {
 *   return {
 *     id: "rest-adapter",
 *     label: "REST API",
 *     async fetchData(query) {
 *       const params = new URLSearchParams({
 *         limit: query.limit.toString(),
 *         offset: query.offset.toString(),
 *         ...(query.search && { q: query.search }),
 *       });
 *       
 *       const response = await fetch(`${baseUrl}?${params}`);
 *       const data = await response.json();
 *       
 *       return {
 *         rows: data.items,
 *         total: data.total,
 *         hasMore: data.items.length === query.limit,
 *       };
 *     },
 *   };
 * }
 * ```
 */
export interface DataAdapter<T = Record<string, any>> {
  /** Unique adapter ID */
  id: string;
  
  /** Human-readable label */
  label: string;
  
  /**
   * Fetch data matching query parameters.
   * 
   * REQUIRED - This is the only method adapters MUST implement.
   * 
   * @param query - Query parameters (filters, sorts, pagination)
   * @returns Result with rows and metadata
   */
  fetchData(query: DataQuery): Promise<DataResult<T>>;
  
  /**
   * Provide schema hints instead of relying on discovery.
   * 
   * OPTIONAL - Implement when:
   * - Backend has explicit schema metadata
   * - Want to override auto-discovery
   * - Need to provide enum values from Type Vault
   * 
   * @returns Schema hints for DynamicDataView
   */
  introspect?(): Promise<SchemaHint | null>;
  
  /**
   * Perform write operations (create/update/delete).
   * 
   * OPTIONAL - Implement for editable views.
   * 
   * @param operation - Mutation to perform
   * @returns Result indicating success/failure
   */
  mutate?(operation: MutationOp<T>): Promise<MutationResult<T>>;
  
  /**
   * Adapter-specific configuration or metadata.
   * 
   * OPTIONAL - For passing custom config to UI.
   */
  config?: Record<string, any>;
}
