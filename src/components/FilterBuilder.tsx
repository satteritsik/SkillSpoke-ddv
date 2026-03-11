/**
 * FilterBuilder Component for DynamicDataView.
 * 
 * Provides UI for building complex filters:
 * - Field selector
 * - Operator selector
 * - Value input (dynamic based on field type)
 * - Add/remove filters
 * - AND logic between filters
 * 
 * Per Section 19.5 of COMPREHENSIVE_IMPLEMENTATION_PLAN.md.
 */

import React, { useState } from 'react';
import type {
  FilterExpression,
  DiscoveredField,
} from '../adapters/DataAdapter';
import {
  getOperatorsForType,
  getDefaultOperator,
  type OperatorMetadata,
} from '../operators/operatorGeneration';

// ============================================================================
// Props
// ============================================================================

export interface FilterBuilderProps {
  /** Available fields for filtering */
  fields: DiscoveredField[];
  
  /** Current filters */
  filters: FilterExpression[];
  
  /** Callback when filters change */
  onFiltersChange: (filters: FilterExpression[]) => void;
  
  /** Maximum number of filters allowed */
  maxFilters?: number;
  
  /** Custom class name */
  className?: string;
}

interface ActiveFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
}

// ============================================================================
// FilterBuilder Component
// ============================================================================

export function FilterBuilder({
  fields,
  filters,
  onFiltersChange,
  maxFilters = 10,
  className = '',
}: FilterBuilderProps): React.JSX.Element {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(
    filters.map((f, idx) => ({
      id: `filter-${idx}`,
      field: f.field,
      operator: f.operator,
      value: f.value,
    }))
  );

  // Add new filter
  const handleAddFilter = () => {
    if (activeFilters.length >= maxFilters) return;
    
    const firstField = fields[0];
    if (!firstField) return;
    
    const defaultOperator = getDefaultOperator(firstField.inferredType);
    
    const newFilter: ActiveFilter = {
      id: `filter-${Date.now()}`,
      field: firstField.name,
      operator: defaultOperator,
      value: '',
    };
    
    const updated = [...activeFilters, newFilter];
    setActiveFilters(updated);
    notifyChange(updated);
  };

  // Remove filter
  const handleRemoveFilter = (id: string) => {
    const updated = activeFilters.filter(f => f.id !== id);
    setActiveFilters(updated);
    notifyChange(updated);
  };

  // Update filter field
  const handleFieldChange = (id: string, newField: string) => {
    const field = fields.find(f => f.name === newField);
    if (!field) return;
    
    const defaultOperator = getDefaultOperator(field.inferredType);
    
    const updated = activeFilters.map(f =>
      f.id === id
        ? { ...f, field: newField, operator: defaultOperator, value: '' }
        : f
    );
    
    setActiveFilters(updated);
    notifyChange(updated);
  };

  // Update filter operator
  const handleOperatorChange = (id: string, newOperator: string) => {
    const updated = activeFilters.map(f =>
      f.id === id ? { ...f, operator: newOperator } : f
    );
    
    setActiveFilters(updated);
    notifyChange(updated);
  };

  // Update filter value
  const handleValueChange = (id: string, newValue: any) => {
    const updated = activeFilters.map(f =>
      f.id === id ? { ...f, value: newValue } : f
    );
    
    setActiveFilters(updated);
    notifyChange(updated);
  };

  // Notify parent of changes
  const notifyChange = (updated: ActiveFilter[]) => {
    const filterExpressions: FilterExpression[] = updated
      .filter(f => f.value !== '' && f.value !== null && f.value !== undefined)
      .map(f => ({
        field: f.field,
        operator: f.operator as any,
        value: f.value,
      }));
    
    onFiltersChange(filterExpressions);
  };

  // Clear all filters
  const handleClearAll = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  return (
    <div className={`filter-builder ${className}`}>
      <div className="filter-builder-header">
        <h3 className="filter-builder-title">Filters</h3>
        {activeFilters.length > 0 && (
          <button
            className="filter-builder-clear-all"
            onClick={handleClearAll}
            type="button"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="filter-builder-list">
        {activeFilters.map(filter => (
          <FilterRow
            key={filter.id}
            filter={filter}
            fields={fields}
            onFieldChange={(newField) => handleFieldChange(filter.id, newField)}
            onOperatorChange={(newOp) => handleOperatorChange(filter.id, newOp)}
            onValueChange={(newVal) => handleValueChange(filter.id, newVal)}
            onRemove={() => handleRemoveFilter(filter.id)}
          />
        ))}
      </div>

      {activeFilters.length < maxFilters && (
        <button
          className="filter-builder-add"
          onClick={handleAddFilter}
          type="button"
          disabled={fields.length === 0}
        >
          + Add filter
        </button>
      )}

      {activeFilters.length > 0 && (
        <div className="filter-builder-summary">
          {activeFilters.length} active {activeFilters.length === 1 ? 'filter' : 'filters'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FilterRow Component
// ============================================================================

interface FilterRowProps {
  filter: ActiveFilter;
  fields: DiscoveredField[];
  onFieldChange: (field: string) => void;
  onOperatorChange: (operator: string) => void;
  onValueChange: (value: any) => void;
  onRemove: () => void;
}

function FilterRow({
  filter,
  fields,
  onFieldChange,
  onOperatorChange,
  onValueChange,
  onRemove,
}: FilterRowProps): React.JSX.Element {
  const selectedField = fields.find(f => f.name === filter.field);
  const operators = selectedField
    ? getOperatorsForType(selectedField.inferredType, selectedField.cardinality)
    : [];
  
  const selectedOperator = operators.find(op => op.operator === filter.operator);

  return (
    <div className="filter-row">
      {/* Field selector */}
      <select
        className="filter-row-field"
        value={filter.field}
        onChange={(e) => onFieldChange(e.target.value)}
      >
        {fields.map(field => (
          <option key={field.name} value={field.name}>
            {field.label || field.name}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        className="filter-row-operator"
        value={filter.operator}
        onChange={(e) => onOperatorChange(e.target.value)}
      >
        {operators.map(op => (
          <option key={op.operator} value={op.operator}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value input */}
      {selectedOperator && (
        <ValueInput
          operator={selectedOperator}
          field={selectedField}
          value={filter.value}
          onChange={onValueChange}
        />
      )}

      {/* Remove button */}
      <button
        className="filter-row-remove"
        onClick={onRemove}
        type="button"
        aria-label="Remove filter"
      >
        ×
      </button>
    </div>
  );
}

// ============================================================================
// ValueInput Component
// ============================================================================

interface ValueInputProps {
  operator: OperatorMetadata;
  field: DiscoveredField | undefined;
  value: any;
  onChange: (value: any) => void;
}

function ValueInput({
  operator,
  field,
  value,
  onChange,
}: ValueInputProps): React.JSX.Element {
  // Boolean input
  if (operator.inputType === 'select' && field?.inferredType === 'boolean') {
    return (
      <select
        className="filter-value-select"
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={(e) => onChange(e.target.value === 'true')}
      >
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  // Enum input (single select)
  if (operator.inputType === 'select' && field?.inferredType === 'enum') {
    return (
      <select
        className="filter-value-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {field.sampleValues.map((val: any) => (
          <option key={val} value={val}>
            {String(val)}
          </option>
        ))}
      </select>
    );
  }

  // Multi-select (for 'in' and 'notIn' operators)
  if (operator.inputType === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : [];
    
    return (
      <div className="filter-value-multiselect">
        {field?.sampleValues.map((val: any) => {
          const isSelected = selectedValues.includes(val);
          return (
            <label key={val} className="filter-value-checkbox">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, val]);
                  } else {
                    onChange(selectedValues.filter((v: any) => v !== val));
                  }
                }}
              />
              <span>{String(val)}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // Number input
  if (operator.inputType === 'number') {
    if (operator.requiresTwoValues) {
      const [min, max] = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="filter-value-range">
          <input
            type="number"
            className="filter-value-input"
            placeholder="Min"
            value={min}
            onChange={(e) => onChange([e.target.value, max])}
          />
          <span>to</span>
          <input
            type="number"
            className="filter-value-input"
            placeholder="Max"
            value={max}
            onChange={(e) => onChange([min, e.target.value])}
          />
        </div>
      );
    }
    
    return (
      <input
        type="number"
        className="filter-value-input"
        placeholder="Enter number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  // Date input
  if (operator.inputType === 'date') {
    if (operator.requiresTwoValues) {
      const [start, end] = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="filter-value-range">
          <input
            type="date"
            className="filter-value-input"
            value={start}
            onChange={(e) => onChange([e.target.value, end])}
          />
          <span>to</span>
          <input
            type="date"
            className="filter-value-input"
            value={end}
            onChange={(e) => onChange([start, e.target.value])}
          />
        </div>
      );
    }
    
    return (
      <input
        type="date"
        className="filter-value-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // DateTime input
  if (operator.inputType === 'datetime') {
    if (operator.requiresTwoValues) {
      const [start, end] = Array.isArray(value) ? value : ['', ''];
      return (
        <div className="filter-value-range">
          <input
            type="datetime-local"
            className="filter-value-input"
            value={start}
            onChange={(e) => onChange([e.target.value, end])}
          />
          <span>to</span>
          <input
            type="datetime-local"
            className="filter-value-input"
            value={end}
            onChange={(e) => onChange([start, e.target.value])}
          />
        </div>
      );
    }
    
    return (
      <input
        type="datetime-local"
        className="filter-value-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // Default: text input
  return (
    <input
      type="text"
      className="filter-value-input"
      placeholder="Enter value"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
