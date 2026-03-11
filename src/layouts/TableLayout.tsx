
import React from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import type { DiscoveredField } from '../discovery/fieldDiscovery';
import type { SortExpression } from '../adapters/DataAdapter';

/**
 * Props for TableLayout component.
 */
export interface TableLayoutProps {
  rows: any[];
  fields: DiscoveredField[];
  sorts: SortExpression[];
  onSortChange: (field: string) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void;
  onRowClick?: (row: any) => void;
}

/**
 * Table layout component for DynamicDataView.
 *
 * Renders discovered fields as columns with sortable headers.
 * Supports row selection and row click callbacks.
 * Responsive design for mobile.
 */
export function TableLayout({
  rows,
  fields,
  sorts,
  onSortChange,
  rowSelection = {},
  onRowSelectionChange,
  onRowClick,
}: TableLayoutProps): React.JSX.Element {
  /**
   * Get sort icon for a field.
   */
  const getSortIcon = (fieldName: string): string => {
    const sort = sorts.find((s) => s.field === fieldName);
    if (!sort) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  /**
   * Handle row selection toggle.
   */
  const handleRowSelectionToggle = (rowIndex: number) => {
    if (!onRowSelectionChange) return;

    const newSelection = { ...rowSelection };
    if (newSelection[rowIndex]) {
      delete newSelection[rowIndex];
    } else {
      newSelection[rowIndex] = true;
    }
    onRowSelectionChange(newSelection);
  };

  /**
   * Handle select all toggle.
   */
  const handleSelectAll = () => {
    if (!onRowSelectionChange) return;

    const allSelected = Object.keys(rowSelection).length === rows.length;
    if (allSelected) {
      onRowSelectionChange({});
    } else {
      const newSelection: RowSelectionState = {};
      rows.forEach((_, index) => {
        newSelection[index] = true;
      });
      onRowSelectionChange(newSelection);
    }
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

  const allSelected = Object.keys(rowSelection).length === rows.length && rows.length > 0;
  const someSelected = Object.keys(rowSelection).length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-warm-gray/30">
        <thead className="bg-midnight-indigo">
          <tr>
            {/* Selection checkbox column */}
            {onRowSelectionChange && (
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = someSelected;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-warm-gray/30 text-warm-gold focus:ring-warm-gold/50"
                />
              </th>
            )}

            {/* Field columns */}
            {fields.map((field) => (
              <th
                key={field.name}
                onClick={() => onSortChange(field.name)}
                className="px-6 py-3 text-left text-xs font-medium text-warm-gray uppercase tracking-wider cursor-pointer hover:bg-warm-gray/10"
              >
                <div className="flex items-center gap-1">
                  <span>{field.label}</span>
                  <span className="text-warm-gray/50">{getSortIcon(field.name)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-midnight-indigo divide-y divide-warm-gray/30">
          {rows.map((row, rowIndex) => {
            const isSelected = rowSelection[rowIndex] === true;
            return (
              <tr
                key={rowIndex}
                className={`transition-colors ${
                  isSelected ? 'bg-warm-gold/10' : 'hover:bg-warm-gray/5'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                  // Don't trigger row click if clicking checkbox
                  if ((e.target as HTMLElement).tagName !== 'INPUT' && onRowClick) {
                    onRowClick(row);
                  }
                }}
              >
                {/* Selection checkbox */}
                {onRowSelectionChange && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleRowSelectionToggle(rowIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-warm-gray/30 text-warm-gold focus:ring-warm-gold/50"
                    />
                  </td>
                )}

                {/* Data cells */}
                {fields.map((field) => (
                  <td
                    key={field.name}
                    className="px-6 py-4 whitespace-nowrap text-sm text-warm-white"
                  >
                    {formatCellValue(row[field.name], field)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
