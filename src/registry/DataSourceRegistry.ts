import type { DataAdapter } from '../adapters/DataAdapter';

/**
 * DataSource registration entry.
 */
export interface DataSourceEntry {
  /** Unique identifier for this data source (e.g., "opportunities.mainList") */
  id: string;

  /** DataAdapter instance for this source */
  adapter: DataAdapter;

  /** Optional description for debugging/tooling */
  description?: string;

  /** When this source was registered */
  registeredAt: string;
}

/**
 * Global registry of data sources for DynamicDataView.
 *
 * Allows data sources to be referenced by ID rather than requiring adapter
 * instances to be passed directly. This enables centralized configuration
 * of all data sources and easier integration via the dataSourceId prop.
 *
 * @example
 * ```typescript
 * registerDataSource({
 *   id: 'my-data',
 *   adapter: createRESTAdapter({ baseUrl: '/api/records' }),
 *   description: 'My data source'
 * });
 *
 * const adapter = getDataSource('my-data');
 * ```
 */
class DataSourceRegistry {
  private sources: Map<string, DataSourceEntry> = new Map();

  register(entry: Omit<DataSourceEntry, 'registeredAt'>): void {
    if (this.sources.has(entry.id)) {
      throw new Error(
        `Data source with ID "${entry.id}" is already registered. ` +
        `Use unregister() first if you need to replace it.`
      );
    }
    this.sources.set(entry.id, {
      ...entry,
      registeredAt: new Date().toISOString(),
    });
  }

  get(id: string): DataAdapter {
    const entry = this.sources.get(id);
    if (!entry) {
      const availableIds = Array.from(this.sources.keys());
      throw new Error(
        `No data source registered with ID "${id}". ` +
        `Available sources: ${availableIds.length > 0 ? availableIds.join(', ') : '(none)'}`
      );
    }
    return entry.adapter;
  }

  has(id: string): boolean {
    return this.sources.has(id);
  }

  unregister(id: string): boolean {
    return this.sources.delete(id);
  }

  list(): string[] {
    return Array.from(this.sources.keys());
  }

  listDetailed(): Array<Omit<DataSourceEntry, 'adapter'>> {
    return Array.from(this.sources.values()).map(({ adapter: _adapter, ...entry }) => entry);
  }

  clear(): void {
    this.sources.clear();
  }
}

const registry = new DataSourceRegistry();

export function registerDataSource(entry: Omit<DataSourceEntry, 'registeredAt'>): void {
  registry.register(entry);
}

export function getDataSource(id: string): DataAdapter {
  return registry.get(id);
}

export function hasDataSource(id: string): boolean {
  return registry.has(id);
}

export function unregisterDataSource(id: string): boolean {
  return registry.unregister(id);
}

export function listDataSources(): string[] {
  return registry.list();
}

export function listDataSourcesDetailed(): Array<Omit<DataSourceEntry, 'adapter'>> {
  return registry.listDetailed();
}

export function clearDataSources(): void {
  registry.clear();
}

export { registry as dataSourceRegistry };
