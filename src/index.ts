/**
 * @skillspoke/ddv
 *
 * Dynamic Data View — TanStack Table data presentation library with automatic
 * field discovery, multiple layouts, pluggable adapters, and ViewSet management.
 */

// Core adapter interface and types
export type {
  FilterOperator,
  FilterExpression,
  SortDirection,
  SortExpression,
  DataQuery,
  InferredType,
  DiscoveredField,
  DiscoveredSchema,
  DataResult,
  SchemaHint,
  MutationType,
  MutationOp,
  MutationResult,
  DataAdapter,
} from './adapters/DataAdapter';

// Built-in adapters
export { createArrayAdapter } from './adapters/ArrayAdapter';
export { createRESTAdapter } from './adapters/RESTAdapter';
export type { RESTAdapterConfig } from './adapters/RESTAdapter';

// Field discovery
export { discoverSchema, updateSchema, defaultDiscoveryConfig, generateFieldLabel } from './discovery/fieldDiscovery';
export type { DiscoveryConfig } from './discovery/fieldDiscovery';

// Type inference
export {
  inferTypeWithConfidence,
  refineTypeByFieldName,
  resolveMixedTypes,
  validateType,
  suggestCoercion,
  TYPE_PATTERNS,
} from './discovery/typeInference';
export type { TypeInference } from './discovery/typeInference';

// Operator generation
export {
  getOperatorsForType,
  getDefaultOperator,
  getOperatorMetadata,
  isValidOperatorForType,
  validateFilterValue,
  suggestOperators,
} from './operators/operatorGeneration';
export type { OperatorMetadata } from './operators/operatorGeneration';

// Type Vault plugin
export { createTypeVaultPlugin } from './plugins/TypeVaultPlugin';
export type { TypeVaultPlugin, TypeVaultPluginConfig } from './plugins/TypeVaultPlugin';

// Data source registry
export {
  registerDataSource,
  getDataSource,
  hasDataSource,
  unregisterDataSource,
  listDataSources,
  listDataSourcesDetailed,
  clearDataSources,
  dataSourceRegistry,
} from './registry/DataSourceRegistry';
export type { DataSourceEntry } from './registry/DataSourceRegistry';

// Board types
export type {
  CardFieldDisplay,
  CardFieldConfig,
  WipLimitConfig,
  LaneConfig,
  BoardLayoutConfig,
  BoardLane,
  BoardDragEvent,
} from './types/board';

// ViewSet types
export type {
  LayoutType,
  ColumnConfig,
  GroupConfig,
  ViewSetData,
  ViewSet,
  ViewSetManagerProps,
  ViewSetStorageKey,
  ViewSetStorage,
  CreateViewSetInput,
  UpdateViewSetInput,
  ViewSetExport,
} from './viewsets/ViewSetTypes';

// Default ViewSets
export {
  OPPORTUNITIES_PIPELINE_VIEWSET,
  OPPORTUNITIES_TABLE_VIEWSET,
  HIGH_MATCH_OPPORTUNITIES_VIEWSET,
  DEFAULT_OPPORTUNITIES_VIEWSETS,
  getDefaultViewSets,
  getDefaultViewSet,
} from './viewsets/defaultViewSets';

// Hooks
export { useSelection } from './hooks/useSelection';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Components
export { FilterBuilder } from './components/FilterBuilder';
export type { FilterBuilderProps } from './components/FilterBuilder';

export { DynamicDataViewPanel } from './components/DynamicDataViewPanel';
export type { DynamicDataViewPanelProps, BatchAction } from './components/DynamicDataViewPanel';

// Layouts
export { TableLayout } from './layouts/TableLayout';
export type { TableLayoutProps } from './layouts/TableLayout';

export { BoardLayout } from './layouts/BoardLayout';
export type { BoardLayoutProps } from './layouts/BoardLayout';

// ViewSet Manager
export { ViewSetManager } from './viewsets/ViewSetManager';
