
import type { DataAdapter, DataQuery, DataResult, FilterExpression } from './DataAdapter';

/**
 * Create an in-memory array adapter for DynamicDataView.
 * 
 * This adapter implements filtering, sorting, and pagination in JavaScript
 * on a static array. Perfect for demos, testing, and small datasets.
 * Minimal implementation (~15 lines) showing the simplest possible adapter.
 * 
 * @param data - Array of objects to serve as the data source
 * @param id - Optional unique identifier for this adapter instance
 * 
 * @example
 * ```typescript
 * const opportunities = [
 *   { id: '1', title: 'Engineer', status: 'active' },
 *   { id: '2', title: 'Designer', status: 'closed' },
 * ];
 * const adapter = createArrayAdapter(opportunities, 'demo-opportunities');
 * ```
 */
export function createArrayAdapter(data: any[], id?: string): DataAdapter {
  return {
    id: id || 'array-adapter',
    label: `In-Memory Array (${data.length} rows)`,

    async fetchData(query: DataQuery): Promise<DataResult> {
      let filtered = [...data];

      // Apply filters
      if (query.filters && query.filters.length > 0) {
        filtered = filtered.filter((row) => {
          return query.filters!.every((filter) => {
            const value = row[filter.field];
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'eq':
                return value === filterValue;
              case 'neq':
                return value !== filterValue;
              case 'gt':
                return value > filterValue;
              case 'gte':
                return value >= filterValue;
              case 'lt':
                return value < filterValue;
              case 'lte':
                return value <= filterValue;
              case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
              case 'startsWith':
                return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
              case 'endsWith':
                return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
              case 'in':
                return Array.isArray(filterValue) && filterValue.includes(value);
              case 'notIn':
                return Array.isArray(filterValue) && !filterValue.includes(value);
              default:
                return true;
            }
          });
        });
      }

      // Apply search (searches all string fields)
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter((row) => {
          return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchLower)
          );
        });
      }

      // Apply sorting
      if (query.sorts && query.sorts.length > 0) {
        filtered.sort((a, b) => {
          for (const sort of query.sorts!) {
            const aVal = a[sort.field];
            const bVal = b[sort.field];

            if (aVal === bVal) continue;

            const comparison = aVal < bVal ? -1 : 1;
            return sort.direction === 'desc' ? -comparison : comparison;
          }
          return 0;
        });
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || filtered.length;
      const paginated = filtered.slice(offset, offset + limit);

      // Apply field projection
      let rows = paginated;
      if (query.fields && query.fields.length > 0) {
        rows = paginated.map((row) => {
          const projected: Record<string, any> = {};
          for (const field of query.fields!) {
            if (field in row) {
              projected[field] = row[field];
            }
          }
          return projected;
        });
      }

      return {
        rows,
        total: filtered.length,
        hasMore: offset + limit < filtered.length,
      };
    },
  };
}
