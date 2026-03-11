import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import type { DataAdapter, DataQuery, FilterExpression, SortExpression } from '../adapters/DataAdapter';
import type { DiscoveredField } from '../discovery/fieldDiscovery';
import type { TypeVaultPlugin } from '../plugins/TypeVaultPlugin';
import type { ViewSet, ViewSetData, LayoutType, GroupConfig } from '../viewsets/ViewSetTypes';
import { discoverSchema } from '../discovery/fieldDiscovery';
import { FilterBuilder } from './FilterBuilder';
import { TableLayout } from '../layouts/TableLayout';
import { BoardLayout } from '../layouts/BoardLayout';
import { ViewSetManager } from '../viewsets/ViewSetManager';
import { getDataSource } from '../registry/DataSourceRegistry';

/**
 * Batch action definition.
 */
export interface BatchAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger';
}

/**
 * Props for DynamicDataViewPanel component.
 */
export interface DynamicDataViewPanelProps {
  /**
   * Data adapter that implements the DataAdapter interface.
   * Required if dataSourceId is not provided.
   */
  adapter?: DataAdapter;

  /**
   * Data source ID for registry lookup.
   * Required if adapter is not provided.
   */
  dataSourceId?: string;

  /**
   * Optional initial query to start with.
   */
  initialQuery?: Partial<DataQuery>;

  /**
   * Optional plugins (e.g., Type Vault plugin).
   */
  plugins?: TypeVaultPlugin[];

  /**
   * Initial layout type.
   */
  initialLayout?: LayoutType;

  /**
   * Callback when a record is opened/clicked.
   */
  onOpenRecord?: (row: unknown) => void;

  /**
   * Callback when a batch action is executed.
   */
  onExecuteBatchAction?: (action: string, rows: unknown[]) => Promise<void>;

  /**
   * Available batch actions.
   */
  batchActions?: BatchAction[];

  /**
   * ViewSets for this data source (optional).
   * If not provided, ViewSet management will be hidden.
   */
  viewSets?: ViewSet[];

  /**
   * Current active ViewSet.
   */
  currentViewSet?: ViewSet;

  /**
   * Whether current ViewSet has unsaved changes.
   */
  hasUnsavedChanges?: boolean;

  /**
   * ViewSet management callbacks.
   */
  onViewSetSelect?: (viewSet: ViewSet) => void;
  onSaveViewSet?: () => Promise<void>;
  onCreateViewSet?: (name: string, description?: string) => Promise<void>;
  onRenameViewSet?: (viewSetId: string, newName: string) => Promise<void>;
  onDeleteViewSet?: (viewSetId: string) => Promise<void>;
  onResetToDefault?: () => void;
  onDuplicateViewSet?: (viewSetId: string, newName: string) => Promise<void>;

  /**
   * Initial grouping config for board layout.
   */
  initialGrouping?: GroupConfig;

  /**
   * Optional CSS class name for the root element.
   */
  className?: string;
}

/**
 * Simple inline SVG icons to avoid icon library dependencies.
 */
const TableIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 6v12M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z" />
  </svg>
);

const BoardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * Main DynamicDataView panel component.
 *
 * Orchestrates adapter, discovery, filtering, sorting, and rendering.
 * Automatically discovers fields and generates appropriate UI controls.
 * Supports multiple layouts (table, board) and ViewSet management.
 *
 * @example
 * ```typescript
 * // Using adapter directly
 * const adapter = createRESTAdapter({ baseUrl: '/api/opportunities' });
 *
 * <DynamicDataViewPanel
 *   adapter={adapter}
 *   initialQuery={{ limit: 50 }}
 *   plugins={[typeVaultPlugin]}
 *   onOpenRecord={(row) => navigate(`/opportunities/${row.id}`)}
 * />
 *
 * // Using dataSourceId with registry
 * <DynamicDataViewPanel
 *   dataSourceId="opportunities.mainList"
 *   viewSets={viewSets}
 *   currentViewSet={currentViewSet}
 *   onViewSetSelect={handleViewSetSelect}
 *   onExecuteBatchAction={handleBatchAction}
 * />
 * ```
 */
export function DynamicDataViewPanel({
  adapter: adapterProp,
  dataSourceId,
  initialQuery = {},
  plugins = [],
  initialLayout = 'table',
  onOpenRecord,
  onExecuteBatchAction,
  batchActions = [],
  viewSets,
  currentViewSet,
  hasUnsavedChanges = false,
  onViewSetSelect,
  onSaveViewSet,
  onCreateViewSet,
  onRenameViewSet,
  onDeleteViewSet,
  onResetToDefault,
  onDuplicateViewSet,
  initialGrouping,
  className = '',
}: DynamicDataViewPanelProps): React.JSX.Element {
  const adapter = useMemo(() => {
    if (adapterProp) return adapterProp;
    if (dataSourceId) return getDataSource(dataSourceId);
    throw new Error('DynamicDataViewPanel: Either adapter or dataSourceId must be provided');
  }, [adapterProp, dataSourceId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<unknown[]>([]);
  const [discoveredFields, setDiscoveredFields] = useState<DiscoveredField[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [layout, setLayout] = useState<LayoutType>(initialLayout);

  const [filters, setFilters] = useState<FilterExpression[]>([]);
  const [sorts, setSorts] = useState<SortExpression[]>([]);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(initialQuery.limit || 50);
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupConfig | undefined>(initialGrouping);

  const selectedRows = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => rows[parseInt(index, 10)])
      .filter(Boolean);
  }, [rowSelection, rows]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query: DataQuery = {
        filters: filters.length > 0 ? filters : undefined,
        sorts: sorts.length > 0 ? sorts : undefined,
        offset,
        limit,
        search: search || undefined,
      };

      const result = await adapter.fetchData(query);
      setRows(result.rows);
      setTotal(result.total);
      setHasMore(result.hasMore);

      if (result.rows.length > 0) {
        const schema = discoverSchema(result.rows as Record<string, unknown>[]);

        for (const field of schema.fields) {
          for (const plugin of plugins) {
            if (plugin.shouldUseTypeVault(field)) {
              try {
                const typeVaultValues = await plugin.getEnumValues(field.name);
                if (typeVaultValues.length > 0) {
                  field.sampleValues = typeVaultValues;
                  (field as unknown as Record<string, unknown>)['isTypeVault'] = true;
                }
              } catch (err) {
                console.warn(`Type Vault lookup failed for ${field.name}:`, err);
              }
            }
          }
        }

        setDiscoveredFields(schema.fields);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [adapter, filters, sorts, offset, limit, search, plugins]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = useCallback((newFilters: FilterExpression[]) => {
    setFilters(newFilters);
    setOffset(0);
  }, []);

  const handleSortChange = useCallback((field: string) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.field === field);
      if (existing) {
        if (existing.direction === 'asc') {
          return prev.map((s) => s.field === field ? { ...s, direction: 'desc' as const } : s);
        } else {
          return prev.filter((s) => s.field !== field);
        }
      }
      return [...prev, { field, direction: 'asc' as const }];
    });
  }, []);

  const handleRowSelectionChange = useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
    },
    [rowSelection]
  );

  const handleNextPage = useCallback(() => {
    if (hasMore) setOffset((prev) => prev + limit);
  }, [hasMore, limit]);

  const handlePrevPage = useCallback(() => {
    if (offset > 0) setOffset((prev) => Math.max(0, prev - limit));
  }, [offset, limit]);

  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayout(newLayout);
    setRowSelection({});
  }, []);

  const handleBatchAction = useCallback(
    async (actionId: string) => {
      if (!onExecuteBatchAction || selectedRows.length === 0) return;
      try {
        await onExecuteBatchAction(actionId, selectedRows);
        setRowSelection({});
        await fetchData();
      } catch (err) {
        console.error('Batch action failed:', err);
        setError(err instanceof Error ? err.message : 'Batch action failed');
      }
    },
    [onExecuteBatchAction, selectedRows, fetchData]
  );

  const renderLayout = () => {
    if (loading) {
      return (
        <div className="ddv-loading">
          <div>Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="ddv-error">
          <p className="ddv-error-title">Error loading data</p>
          <p className="ddv-error-message">{error}</p>
          <button onClick={fetchData} className="ddv-retry-button">Retry</button>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="ddv-empty">
          <p>No data found</p>
          <p>Try adjusting your filters or search</p>
        </div>
      );
    }

    switch (layout) {
      case 'board':
        if (!grouping) {
          return <div className="ddv-board-no-grouping">Board layout requires grouping configuration</div>;
        }
        return (
          <BoardLayout
            rows={rows as Record<string, unknown>[]}
            fields={discoveredFields}
            sorts={sorts}
            onSortChange={handleSortChange}
            grouping={grouping}
            onCardClick={onOpenRecord}
          />
        );
      case 'table':
      default:
        return (
          <TableLayout
            rows={rows as Record<string, unknown>[]}
            fields={discoveredFields}
            sorts={sorts}
            onSortChange={handleSortChange}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
            onRowClick={onOpenRecord}
          />
        );
    }
  };

  const renderViewSetManager = () => {
    if (!viewSets || !currentViewSet || !onViewSetSelect) return null;
    return (
      <ViewSetManager
        dataSourceId={dataSourceId || 'unknown'}
        currentViewSet={currentViewSet}
        viewSets={viewSets}
        hasUnsavedChanges={hasUnsavedChanges}
        onViewSetSelect={onViewSetSelect}
        onSaveChanges={onSaveViewSet || (async () => {})}
        onCreateNew={onCreateViewSet || (async () => {})}
        onRename={onRenameViewSet || (async () => {})}
        onDelete={onDeleteViewSet || (async () => {})}
        onResetToDefault={onResetToDefault || (() => {})}
        onDuplicate={onDuplicateViewSet}
      />
    );
  };

  const renderBatchActionsToolbar = () => {
    if (!onExecuteBatchAction || selectedRows.length === 0 || batchActions.length === 0) return null;
    return (
      <div className="ddv-batch-toolbar">
        <div className="ddv-batch-count">
          {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
        </div>
        <div className="ddv-batch-actions">
          {batchActions.map((action) => {
            const Icon = action.icon || TrashIcon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleBatchAction(action.id)}
                className={`ddv-batch-action ${action.variant === 'danger' ? 'ddv-batch-action--danger' : ''}`}
              >
                <Icon className="ddv-icon" />
                {action.label}
              </button>
            );
          })}
          <button type="button" onClick={() => setRowSelection({})} className="ddv-batch-clear">
            Clear
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`ddv-panel ${className}`}>
      <div className="ddv-header">
        <div className="ddv-header-top">
          <h2 className="ddv-title">{adapter.label}</h2>
          <div className="ddv-header-actions">
            {renderViewSetManager()}
            <div className="ddv-layout-toggle">
              <button
                type="button"
                onClick={() => handleLayoutChange('table')}
                className={`ddv-layout-btn ${layout === 'table' ? 'ddv-layout-btn--active' : ''}`}
                title="Table view"
              >
                <TableIcon className="ddv-icon" />
              </button>
              <button
                type="button"
                onClick={() => handleLayoutChange('board')}
                className={`ddv-layout-btn ${layout === 'board' ? 'ddv-layout-btn--active' : ''}`}
                title="Board view"
                disabled={!grouping}
              >
                <BoardIcon className="ddv-icon" />
              </button>
            </div>
          </div>
        </div>

        <div className="ddv-search">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            className="ddv-search-input"
          />
        </div>

        {discoveredFields.length > 0 && (
          <FilterBuilder
            fields={discoveredFields}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        )}
      </div>

      {renderBatchActionsToolbar()}

      <div className="ddv-content">
        {renderLayout()}
      </div>

      <div className="ddv-pagination">
        <div className="ddv-pagination-info">
          Showing {offset + 1} – {Math.min(offset + rows.length, total ?? offset + rows.length)}
          {total !== undefined && ` of ${total}`}
        </div>
        <div className="ddv-pagination-controls">
          <button onClick={handlePrevPage} disabled={offset === 0} className="ddv-page-btn">
            Previous
          </button>
          <button onClick={handleNextPage} disabled={!hasMore} className="ddv-page-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
