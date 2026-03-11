# @skillspoke/ddv

Dynamic Data View — a React data presentation library built on TanStack Table.

Provides automatic field discovery, table and Kanban board layouts, pluggable adapters,
dynamic filter generation, and saved ViewSet management.

## Features

- Automatic schema discovery from any data source
- Table layout with sorting, selection, and pagination
- Board (Kanban) layout with configurable lane grouping
- Pluggable adapter interface — 10–50 lines to integrate any backend
- Dynamic filter builder with type-appropriate operators
- ViewSet management (save, switch, rename, duplicate, import/export)
- Type Vault plugin for enum value resolution
- Built-in REST and in-memory array adapters

## Installation

```bash
npm install @skillspoke/ddv
```

Peer dependencies:

```bash
npm install react react-dom @tanstack/react-table
```

## Quick Start

```tsx
import { DynamicDataViewPanel, createRESTAdapter } from '@skillspoke/ddv';

const adapter = createRESTAdapter({ baseUrl: 'https://api.example.com/records' });

export function MyView() {
  return (
    <DynamicDataViewPanel
      adapter={adapter}
      initialQuery={{ limit: 50 }}
      onOpenRecord={(row) => console.log('opened', row)}
    />
  );
}
```

## Adapters

### REST Adapter

```typescript
import { createRESTAdapter } from '@skillspoke/ddv';

const adapter = createRESTAdapter({
  baseUrl: 'https://api.example.com/items',
  authToken: 'Bearer token123',
});
```

### In-Memory Array Adapter

```typescript
import { createArrayAdapter } from '@skillspoke/ddv';

const data = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'pending' },
];
const adapter = createArrayAdapter(data, 'my-data');
```

### Custom Adapter

Implement the `DataAdapter` interface — only `fetchData` is required:

```typescript
import type { DataAdapter } from '@skillspoke/ddv';

const myAdapter: DataAdapter = {
  id: 'my-source',
  label: 'My Data Source',
  async fetchData(query) {
    const response = await fetch(`/api/data?limit=${query.limit}&offset=${query.offset}`);
    const data = await response.json();
    return {
      rows: data.items,
      total: data.total,
      hasMore: data.items.length === query.limit,
    };
  },
};
```

## Data Source Registry

Register adapters globally and look them up by ID:

```typescript
import { registerDataSource, getDataSource } from '@skillspoke/ddv';

// Register once at app initialization
registerDataSource({
  id: 'my-records',
  adapter: myAdapter,
  description: 'Main records view',
});

// Use by ID in components
<DynamicDataViewPanel dataSourceId="my-records" />
```

## ViewSets

ViewSets are saved view configurations (layout, columns, filters, sorts, grouping):

```tsx
import { DynamicDataViewPanel } from '@skillspoke/ddv';
import type { ViewSet } from '@skillspoke/ddv';

const defaultViewSet: ViewSet = {
  id: 'default',
  name: 'All Records',
  isDefault: true,
  data: { layout: 'table', filters: [], sorts: [], pageSize: 25 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

<DynamicDataViewPanel
  adapter={adapter}
  viewSets={[defaultViewSet]}
  currentViewSet={defaultViewSet}
  onViewSetSelect={(vs) => setCurrentViewSet(vs)}
  onSaveViewSet={async () => { /* persist to backend */ }}
  onCreateViewSet={async (name, desc) => { /* create and persist */ }}
  onDeleteViewSet={async (id) => { /* delete from backend */ }}
/>
```

## Board Layout

Enable Kanban board layout with a grouping configuration:

```tsx
import type { GroupConfig } from '@skillspoke/ddv';

const grouping: GroupConfig = {
  field: 'status',
  label: 'Status',
  showEmpty: true,
  order: ['todo', 'in-progress', 'done'],
  colors: { todo: '#3b82f6', 'in-progress': '#f59e0b', done: '#10b981' },
};

<DynamicDataViewPanel
  adapter={adapter}
  initialLayout="board"
  initialGrouping={grouping}
/>
```

## Type Vault Plugin

Resolve enum values from an external type system:

```typescript
import { createTypeVaultPlugin } from '@skillspoke/ddv';

const plugin = createTypeVaultPlugin({
  fields: {
    status: 'RecordStatus',
    priority: 'Priority',
  },
  apiBaseUrl: 'https://api.example.com/type-vault',
  authToken: 'Bearer token',
});

<DynamicDataViewPanel adapter={adapter} plugins={[plugin]} />
```

## Hooks

```tsx
import { useSelection, useKeyboardShortcuts } from '@skillspoke/ddv';

function MyComponent({ allIds }: { allIds: string[] }) {
  const { selectedIds, selectAll, clearSelection, toggleSelection, isSelected, count } = useSelection();

  useKeyboardShortcuts({
    onSelectAll: () => selectAll(allIds),
    onClearSelection: clearSelection,
    enabled: true,
  });

  return <div>{count} selected</div>;
}
```

## Styling

DDV uses semantic class names prefixed with `ddv-` and imposes no visual styles.
Bring your own CSS or Tailwind classes. The components use className props where
applicable for integration with any design system.

## License

MIT
