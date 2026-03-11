/**
 * Dynamic Operator Generation for DynamicDataView Filters.
 * 
 * Automatically generates appropriate filter operators based on field type:
 * - String fields → contains, startsWith, endsWith, eq
 * - Number fields → gt, gte, lt, lte, eq, between
 * - Boolean fields → eq only
 * - Date/DateTime fields → before, after, between
 * - Enum fields → eq, in, notIn
 * - ID fields → eq, in
 * 
 * Per Section 19.4 of COMPREHENSIVE_IMPLEMENTATION_PLAN.md.
 */

import type { FilterOperator, InferredType } from '../adapters/DataAdapter';

// ============================================================================
// Operator Metadata
// ============================================================================

/**
 * Metadata for a single filter operator.
 */
export interface OperatorMetadata {
  /** Operator code (eq, contains, etc.) */
  operator: FilterOperator;
  
  /** Human-readable label */
  label: string;
  
  /** Short description of what operator does */
  description: string;
  
  /** Whether operator requires a value input */
  requiresValue: boolean;
  
  /** Whether operator takes two values (e.g., between) */
  requiresTwoValues: boolean;
  
  /** Input type hint for UI (text, number, date, select) */
  inputType: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect';
  
  /** Whether this operator is case-sensitive (for string operations) */
  caseSensitive?: boolean;
}

// ============================================================================
// Operator Definitions by Type
// ============================================================================

const STRING_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'equals',
    description: 'Exactly matches',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
    caseSensitive: false,
  },
  {
    operator: 'neq',
    label: 'does not equal',
    description: 'Does not match',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
    caseSensitive: false,
  },
  {
    operator: 'contains',
    label: 'contains',
    description: 'Contains substring',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
    caseSensitive: false,
  },
  {
    operator: 'startsWith',
    label: 'starts with',
    description: 'Starts with prefix',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
    caseSensitive: false,
  },
  {
    operator: 'endsWith',
    label: 'ends with',
    description: 'Ends with suffix',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
    caseSensitive: false,
  },
];

const NUMBER_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'equals',
    description: 'Exactly equals',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'neq',
    label: 'does not equal',
    description: 'Not equal to',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'gt',
    label: 'greater than',
    description: 'Strictly greater than',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'gte',
    label: 'greater than or equal',
    description: 'Greater than or equal to',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'lt',
    label: 'less than',
    description: 'Strictly less than',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'lte',
    label: 'less than or equal',
    description: 'Less than or equal to',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'number',
  },
  {
    operator: 'between',
    label: 'between',
    description: 'Between min and max (inclusive)',
    requiresValue: true,
    requiresTwoValues: true,
    inputType: 'number',
  },
];

const BOOLEAN_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'is',
    description: 'Boolean value',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'select', // true/false dropdown
  },
];

const DATE_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'on',
    description: 'On specific date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'neq',
    label: 'not on',
    description: 'Not on this date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'gt',
    label: 'after',
    description: 'After date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'gte',
    label: 'on or after',
    description: 'On or after date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'lt',
    label: 'before',
    description: 'Before date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'lte',
    label: 'on or before',
    description: 'On or before date',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'date',
  },
  {
    operator: 'between',
    label: 'between',
    description: 'Between two dates',
    requiresValue: true,
    requiresTwoValues: true,
    inputType: 'date',
  },
];

const DATETIME_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'at',
    description: 'At specific datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'neq',
    label: 'not at',
    description: 'Not at this datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'gt',
    label: 'after',
    description: 'After datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'gte',
    label: 'at or after',
    description: 'At or after datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'lt',
    label: 'before',
    description: 'Before datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'lte',
    label: 'at or before',
    description: 'At or before datetime',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'datetime',
  },
  {
    operator: 'between',
    label: 'between',
    description: 'Between two datetimes',
    requiresValue: true,
    requiresTwoValues: true,
    inputType: 'datetime',
  },
];

const ENUM_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'is',
    description: 'Equals value',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'select', // Dropdown of enum values
  },
  {
    operator: 'neq',
    label: 'is not',
    description: 'Not equal to value',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'select',
  },
  {
    operator: 'in',
    label: 'is one of',
    description: 'In set of values',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'multiselect', // Multi-select dropdown
  },
  {
    operator: 'notIn',
    label: 'is not one of',
    description: 'Not in set of values',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'multiselect',
  },
];

const ID_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'equals',
    description: 'Exact ID match',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
  },
  {
    operator: 'neq',
    label: 'does not equal',
    description: 'Not this ID',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
  },
  {
    operator: 'in',
    label: 'is one of',
    description: 'In set of IDs',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'multiselect',
  },
  {
    operator: 'notIn',
    label: 'is not one of',
    description: 'Not in set of IDs',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'multiselect',
  },
];

const UNKNOWN_OPERATORS: OperatorMetadata[] = [
  {
    operator: 'eq',
    label: 'equals',
    description: 'Equals value',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
  },
  {
    operator: 'neq',
    label: 'does not equal',
    description: 'Not equal to value',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
  },
  {
    operator: 'contains',
    label: 'contains',
    description: 'Contains substring',
    requiresValue: true,
    requiresTwoValues: false,
    inputType: 'text',
  },
];

// ============================================================================
// Operator Generation
// ============================================================================

/**
 * Get available filter operators for a field based on its inferred type.
 * 
 * @param fieldType - Inferred type of the field
 * @param cardinality - Number of distinct values (for enum refinement)
 * @returns Array of applicable operators
 * 
 * @example
 * ```typescript
 * // String field
 * const ops = getOperatorsForType('string', 100);
 * // Returns: [eq, neq, contains, startsWith, endsWith]
 * 
 * // Low-cardinality string (enum)
 * const ops = getOperatorsForType('string', 5);
 * // Returns: [eq, neq, in, notIn] - enum operators
 * 
 * // Number field
 * const ops = getOperatorsForType('number', 100);
 * // Returns: [eq, neq, gt, gte, lt, lte, between]
 * ```
 */
export function getOperatorsForType(
  fieldType: InferredType,
  cardinality?: number
): OperatorMetadata[] {
  switch (fieldType) {
    case 'string':
      // If low cardinality, might be enum-like
      if (cardinality !== undefined && cardinality <= 20) {
        return [...STRING_OPERATORS, ...ENUM_OPERATORS];
      }
      return STRING_OPERATORS;
    
    case 'number':
      return NUMBER_OPERATORS;
    
    case 'boolean':
      return BOOLEAN_OPERATORS;
    
    case 'date':
      return DATE_OPERATORS;
    
    case 'datetime':
      return DATETIME_OPERATORS;
    
    case 'enum':
      return ENUM_OPERATORS;
    
    case 'id':
      return ID_OPERATORS;
    
    case 'unknown':
    default:
      return UNKNOWN_OPERATORS;
  }
}

/**
 * Get default operator for a field type.
 * 
 * This is used when user adds a new filter - we pre-select a sensible default.
 * 
 * @param fieldType - Inferred type of the field
 * @returns Default operator
 */
export function getDefaultOperator(fieldType: InferredType): FilterOperator {
  switch (fieldType) {
    case 'string':
      return 'contains'; // Most flexible for strings
    
    case 'number':
      return 'eq'; // Exact match is common for numbers
    
    case 'boolean':
      return 'eq'; // Only option
    
    case 'date':
    case 'datetime':
      return 'eq'; // Specific date/time is common
    
    case 'enum':
      return 'eq'; // Single value selection
    
    case 'id':
      return 'eq'; // Exact ID match
    
    case 'unknown':
    default:
      return 'eq'; // Safe default
  }
}

/**
 * Get operator by code.
 * 
 * @param operator - Operator code
 * @param fieldType - Field type (for context-specific metadata)
 * @returns Operator metadata or undefined
 */
export function getOperatorMetadata(
  operator: FilterOperator,
  fieldType: InferredType
): OperatorMetadata | undefined {
  const operators = getOperatorsForType(fieldType);
  return operators.find(op => op.operator === operator);
}

// ============================================================================
// Operator Validation
// ============================================================================

/**
 * Validate if operator is applicable to field type.
 * 
 * @param operator - Operator to validate
 * @param fieldType - Field type
 * @returns Whether operator is valid for this type
 */
export function isValidOperatorForType(
  operator: FilterOperator,
  fieldType: InferredType
): boolean {
  const operators = getOperatorsForType(fieldType);
  return operators.some(op => op.operator === operator);
}

/**
 * Validate filter value based on operator requirements.
 * 
 * @param operator - Operator metadata
 * @param value - Filter value to validate
 * @returns Validation result with error message if invalid
 */
export function validateFilterValue(
  operator: OperatorMetadata,
  value: any
): { valid: boolean; error?: string } {
  // Check if value is required
  if (operator.requiresValue) {
    if (value === null || value === undefined || value === '') {
      return {
        valid: false,
        error: 'Value is required for this operator',
      };
    }
  }
  
  // Check if two values required (e.g., between)
  if (operator.requiresTwoValues) {
    if (!Array.isArray(value) || value.length !== 2) {
      return {
        valid: false,
        error: 'Two values are required for this operator',
      };
    }
    
    // Check both values are provided
    if (value[0] === null || value[0] === undefined || value[0] === '') {
      return {
        valid: false,
        error: 'First value is required',
      };
    }
    if (value[1] === null || value[1] === undefined || value[1] === '') {
      return {
        valid: false,
        error: 'Second value is required',
      };
    }
    
    // For numbers, validate min < max
    if (operator.inputType === 'number') {
      const [min, max] = value;
      if (typeof min === 'number' && typeof max === 'number' && min >= max) {
        return {
          valid: false,
          error: 'Minimum must be less than maximum',
        };
      }
    }
    
    // For dates, validate start < end
    if (operator.inputType === 'date' || operator.inputType === 'datetime') {
      const [start, end] = value;
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate >= endDate) {
        return {
          valid: false,
          error: 'Start date must be before end date',
        };
      }
    }
  }
  
  // Type-specific validation
  if (operator.inputType === 'number') {
    if (operator.requiresTwoValues) {
      const [min, max] = value;
      if (typeof min !== 'number' || typeof max !== 'number') {
        return {
          valid: false,
          error: 'Both values must be numbers',
        };
      }
    } else {
      if (typeof value !== 'number') {
        return {
          valid: false,
          error: 'Value must be a number',
        };
      }
    }
  }
  
  return { valid: true };
}

// ============================================================================
// Operator Suggestion
// ============================================================================

/**
 * Suggest most appropriate operators based on field characteristics.
 * 
 * Takes into account:
 * - Field type
 * - Cardinality
 * - Sample values
 * - Field name
 * 
 * @param fieldType - Inferred field type
 * @param fieldName - Name of the field
 * @param cardinality - Number of distinct values
 * @param sampleValues - Sample values from field
 * @returns Sorted array of operators (most relevant first)
 */
export function suggestOperators(
  fieldType: InferredType,
  fieldName: string,
  cardinality?: number,
  sampleValues?: any[]
): OperatorMetadata[] {
  const baseOperators = getOperatorsForType(fieldType, cardinality);
  
  // For low-cardinality fields, prioritize enum operators
  if (cardinality !== undefined && cardinality <= 10 && fieldType === 'string') {
    const enumOps = baseOperators.filter(op => 
      op.operator === 'eq' || op.operator === 'in'
    );
    const otherOps = baseOperators.filter(op =>
      op.operator !== 'eq' && op.operator !== 'in'
    );
    return [...enumOps, ...otherOps];
  }
  
  // For status/state fields, prioritize equality and set membership
  const lowerName = fieldName.toLowerCase();
  if (
    lowerName.includes('status') ||
    lowerName.includes('state') ||
    lowerName.includes('type')
  ) {
    const priorityOps = baseOperators.filter(op =>
      op.operator === 'eq' || op.operator === 'in' || op.operator === 'neq'
    );
    const otherOps = baseOperators.filter(op =>
      op.operator !== 'eq' && op.operator !== 'in' && op.operator !== 'neq'
    );
    return [...priorityOps, ...otherOps];
  }
  
  // For date fields with recent values, prioritize "after" operator
  if ((fieldType === 'date' || fieldType === 'datetime') && sampleValues) {
    const recentDates = sampleValues.some(v => {
      const date = new Date(v);
      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 365; // Within last year
    });
    
    if (recentDates) {
      const afterOp = baseOperators.find(op => op.operator === 'gt' || op.operator === 'gte');
      const otherOps = baseOperators.filter(op => op.operator !== 'gt' && op.operator !== 'gte');
      return afterOp ? [afterOp, ...otherOps] : baseOperators;
    }
  }
  
  // Default: return as-is
  return baseOperators;
}
