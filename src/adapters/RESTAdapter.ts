
import type { DataAdapter, DataQuery, DataResult } from './DataAdapter';

/**
 * REST API adapter configuration options.
 */
export interface RESTAdapterConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  authToken?: string;
}

/**
 * Create a REST API adapter for DynamicDataView.
 * 
 * This adapter translates DataQuery to URL query parameters and uses fetch()
 * to call a backend REST API. It's a minimal implementation (~20 lines) showing
 * how simple adapter creation can be.
 * 
 * @example
 * ```typescript
 * const adapter = createRESTAdapter({
 *   baseUrl: 'https://api.example.com/opportunities',
 *   authToken: 'Bearer token123'
 * });
 * ```
 */
export function createRESTAdapter(config: RESTAdapterConfig): DataAdapter {
  const { baseUrl, headers = {}, authToken } = config;

  return {
    id: 'rest-adapter',
    label: 'REST API Data Source',

    async fetchData(query: DataQuery): Promise<DataResult> {
      const params = new URLSearchParams();
      
      if (query.limit) params.set('limit', query.limit.toString());
      if (query.offset) params.set('offset', query.offset.toString());
      if (query.search) params.set('search', query.search);
      
      if (query.filters) {
        params.set('filters', JSON.stringify(query.filters));
      }
      
      if (query.sorts) {
        params.set('sorts', JSON.stringify(query.sorts));
      }
      
      if (query.fields) {
        params.set('fields', query.fields.join(','));
      }

      const requestHeaders: Record<string, string> = { ...headers };
      if (authToken) {
        requestHeaders['Authorization'] = authToken;
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: requestHeaders,
      });

      if (!response.ok) {
        throw new Error(`REST API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        rows: data.rows || data.items || data,
        total: data.total,
        hasMore: data.hasMore ?? (data.rows?.length === query.limit),
      };
    },
  };
}
