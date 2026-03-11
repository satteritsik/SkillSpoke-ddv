
import React from 'react';
import type { DiscoveredField } from '../discovery/fieldDiscovery';
import type { SortExpression } from '../adapters/DataAdapter';
import type { GroupConfig } from '../viewsets/ViewSetTypes';

/**
 * Props for BoardLayout component.
 */
export interface BoardLayoutProps {
  rows: any[];
  fields: DiscoveredField[];
  sorts: SortExpression[];
  onSortChange: (field: string) => void;
  grouping: GroupConfig;
  onCardClick?: (row: any) => void;
}

/**
 * Board layout component for DynamicDataView.
 *
 * Renders data in Kanban-style columns grouped by a specified field.
 * Responsive design for mobile with horizontal scroll.
 */
export function BoardLayout({
  rows,
  fields,
  sorts,
  onSortChange,
  grouping,
  onCardClick,
}: BoardLayoutProps): React.JSX.Element {
  /**
   * Group rows by the specified field.
   */
  const groupedRows = React.useMemo(() => {
    const groups = new Map<string, any[]>();

    // Initialize groups from order if provided
    if (grouping.order) {
      grouping.order.forEach(value => groups.set(value, []));
    }

    // Group rows by field value
    rows.forEach(row => {
      const value = row[grouping.field];
      const key = value !== null && value !== undefined ? String(value) : 'Uncategorized';

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    });

    // Remove empty groups if configured
    if (!grouping.showEmpty) {
      Array.from(groups.keys()).forEach(key => {
        if (groups.get(key)!.length === 0) {
          groups.delete(key);
        }
      });
    }

    return groups;
  }, [rows, grouping]);

  /**
   * Get color for a group/lane.
   */
  const getGroupColor = (groupValue: string): string => {
    if (grouping.colors && grouping.colors[groupValue]) {
      return grouping.colors[groupValue];
    }
    return '#2563eb'; // Default blue
  };

  /**
   * Format cell value for display.
   */
  const formatCellValue = (value: any, field: DiscoveredField): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    // Format based on inferred type
    switch (field.inferredType) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case 'datetime':
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      default:
        return String(value);
    }
  };

  /**
   * Render a card for a row.
   */
  const renderCard = (row: any, rowIndex: number): React.JSX.Element => {
    return (
      <div
        key={rowIndex}
        onClick={() => onCardClick?.(row)}
        className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow ${
          onCardClick ? 'cursor-pointer hover:shadow-md' : ''
        }`}
      >
        {fields
          .filter(field => field.name !== grouping.field)
          .map((field) => (
            <div key={field.name} className="mb-2 last:mb-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {field.label}
              </div>
              <div className="text-sm text-gray-900 mt-1">
                {formatCellValue(row[field.name], field)}
              </div>
            </div>
          ))}
      </div>
    );
  };

  /**
   * Render a column/lane for a group.
   */
  const renderColumn = (groupValue: string, groupRows: any[]): React.JSX.Element => {
    const color = getGroupColor(groupValue);

    return (
      <div
        key={groupValue}
        className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-50 rounded-lg"
      >
        {/* Column Header */}
        <div
          className="p-4 border-b border-gray-200 sticky top-0 bg-gray-50 z-10"
          style={{ borderTopColor: color, borderTopWidth: '4px' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {groupValue}
            </h3>
            <span
              className="text-xs font-bold text-white px-2 py-1 rounded-full"
              style={{ backgroundColor: color }}
            >
              {groupRows.length}
            </span>
          </div>
        </div>

        {/* Column Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {groupRows.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No items in this column
            </div>
          ) : (
            groupRows.map((row, index) => renderCard(row, index))
          )}
        </div>
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No data to display</p>
          <p className="text-sm mt-1">Add filters or adjust your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 p-4 min-h-full">
        {Array.from(groupedRows.entries()).map(([groupValue, groupRows]) =>
          renderColumn(groupValue, groupRows)
        )}
      </div>
    </div>
  );
}
