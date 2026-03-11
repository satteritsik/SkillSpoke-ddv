/**
 * Automatic Field Discovery Engine for DynamicDataView.
 * 
 * Inspects data samples to automatically discover:
 * - Field names and types
 * - Nullable fields
 * - Enum candidates (low cardinality string fields)
 * - Sample values for each field
 * 
 * Per Section 19.2 of COMPREHENSIVE_IMPLEMENTATION_PLAN.md.
 */

import type {
  DiscoveredField,
  DiscoveredSchema,
  InferredType,
} from '../adapters/DataAdapter';

// ============================================================================
// Configuration
// ============================================================================

interface DiscoveryConfig {
  /**
   * Maximum cardinality to consider a field an enum.
   * Fields with <= this many distinct values are flagged as potential enums.
   */
  maxEnumCardinality: number;

  /**
   * Minimum sample size to perform reliable discovery.
   * Discovery will warn if fewer samples provided.
   */
  minSampleSize: number;

  /**
   * Maximum number of sample values to store per field.
   */
  maxSampleValues: number;
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  maxEnumCardinality: 20,
  minSampleSize: 5,
  maxSampleValues: 10,
};

// ============================================================================
// Core Discovery Logic
// ============================================================================

/**
 * Discover schema from data samples.
 * 
 * This is the main entry point for automatic field discovery.
 * 
 * @param rows - Array of data records to analyze
 * @param config - Optional discovery configuration
 * @returns Discovered schema with field metadata
 * 
 * @example
 * ```typescript
 * const rows = [
 *   { id: "1", name: "Alice", status: "active", score: 95 },
 *   { id: "2", name: "Bob", status: "pending", score: 82 },
 * ];
 * 
 * const schema = discoverSchema(rows);
 * // schema.fields[0] = { name: "id", inferredType: "id", ... }
 * // schema.fields[1] = { name: "name", inferredType: "string", ... }
 * // schema.fields[2] = { name: "status", inferredType: "enum", cardinality: 2, ... }
 * // schema.fields[3] = { name: "score", inferredType: "number", ... }
 * ```
 */
export function discoverSchema(
  rows: Record<string, any>[],
  config: Partial<DiscoveryConfig> = {}
): DiscoveredSchema {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Warn if sample size is too small
  if (rows.length < finalConfig.minSampleSize) {
    console.warn(
      `[FieldDiscovery] Sample size (${rows.length}) is smaller than ` +
        `recommended minimum (${finalConfig.minSampleSize}). ` +
        `Discovery may be less accurate.`
    );
  }

  // Extract all unique field names across all rows
  const fieldNames = extractFieldNames(rows);

  // Discover metadata for each field
  const fields = fieldNames.map(fieldName =>
    discoverField(fieldName, rows, finalConfig)
  );

  return {
    fields,
    sampleSize: rows.length,
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Extract all unique field names from data samples.
 */
function extractFieldNames(rows: Record<string, any>[]): string[] {
  const fieldSet = new Set<string>();

  for (const row of rows) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(key => fieldSet.add(key));
    }
  }

  return Array.from(fieldSet).sort();
}

/**
 * Discover metadata for a single field.
 */
function discoverField(
  fieldName: string,
  rows: Record<string, any>[],
  config: DiscoveryConfig
): DiscoveredField {
  // Collect all non-null values for this field
  const nonNullValues: any[] = [];
  let nullCount = 0;

  for (const row of rows) {
    const value = row[fieldName];
    if (value === null || value === undefined) {
      nullCount++;
    } else {
      nonNullValues.push(value);
    }
  }

  // Determine if field is nullable
  const nullable = nullCount > 0;

  // Count distinct values (for enum detection)
  const distinctValues = new Set(
    nonNullValues.map(v => (typeof v === 'object' ? JSON.stringify(v) : v))
  );
  const cardinality = distinctValues.size;

  // Infer type from non-null values
  const inferredType = inferFieldType(
    nonNullValues,
    cardinality,
    config.maxEnumCardinality
  );

  // Select sample values (deduplicated and limited)
  const sampleValues = Array.from(distinctValues)
    .slice(0, config.maxSampleValues)
    .map(v => {
      try {
        return typeof v === 'string' && v.startsWith('{') ? JSON.parse(v) : v;
      } catch {
        return v;
      }
    });

  // Generate human-readable label from field name
  const label = generateFieldLabel(fieldName);

  return {
    name: fieldName,
    inferredType,
    sampleValues,
    nullable,
    cardinality,
    label,
  };
}

/**
 * Infer field type from sample values.
 */
function inferFieldType(
  values: any[],
  cardinality: number,
  maxEnumCardinality: number
): InferredType {
  if (values.length === 0) {
    return 'unknown';
  }

  // Check for ID pattern first (UUID, numeric ID, etc.)
  if (looksLikeId(values)) {
    return 'id';
  }

  // Collect types of all values
  const types = new Set(values.map(getValueType));

  // If all values are same type, use that type
  if (types.size === 1) {
    const singleType = Array.from(types)[0];

    // For strings, check if it's an enum candidate
    if (singleType === 'string' && cardinality <= maxEnumCardinality) {
      return 'enum';
    }

    // For strings, check if they're dates
    if (singleType === 'string') {
      if (allValuesMatchDatePattern(values)) {
        return looksLikeDateTime(values) ? 'datetime' : 'date';
      }
    }

    return singleType;
  }

  // Mixed types - try to find dominant type
  const typeCounts = new Map<InferredType, number>();
  values.forEach(v => {
    const type = getValueType(v);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  // Return most common type
  let maxCount = 0;
  let dominantType: InferredType = 'unknown';
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  });

  return dominantType;
}

/**
 * Get inferred type for a single value.
 */
function getValueType(value: any): InferredType {
  if (value === null || value === undefined) {
    return 'unknown';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'string') {
    // Check if it's a date/datetime string
    if (looksLikeDateString(value)) {
      return looksLikeDateTimeString(value) ? 'datetime' : 'date';
    }
    return 'string';
  }

  // Objects and arrays default to unknown
  return 'unknown';
}

/**
 * Check if values look like IDs (UUIDs, numeric IDs, etc.).
 */
function looksLikeId(values: any[]): boolean {
  if (values.length === 0) return false;

  // All values should be string or number
  const allStringOrNumber = values.every(
    v => typeof v === 'string' || typeof v === 'number'
  );
  if (!allStringOrNumber) return false;

  // Check for UUID pattern
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const someUUIDs = values
    .slice(0, 5)
    .some(v => typeof v === 'string' && uuidPattern.test(v));
  if (someUUIDs) return true;

  // Check for numeric ID pattern (all numbers, mostly sequential)
  const allNumbers = values.every(v => typeof v === 'number');
  if (allNumbers) {
    // If numbers are mostly sequential, likely IDs
    const sorted = [...values].sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < Math.min(sorted.length, 10); i++) {
      gaps.push(sorted[i] - sorted[i - 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap <= 2) return true; // Sequential or near-sequential
  }

  // Check for string ID pattern (prefixed IDs like "user_123", "ord_abc")
  if (values.every(v => typeof v === 'string')) {
    const prefixPattern = /^[a-z]+[_-][\w]+$/i;
    const hasPrefixedIds = values
      .slice(0, 5)
      .some(v => typeof v === 'string' && prefixPattern.test(v));
    if (hasPrefixedIds) return true;
  }

  return false;
}

/**
 * Check if all values match date/datetime pattern.
 */
function allValuesMatchDatePattern(values: any[]): boolean {
  return values.every(
    v => typeof v === 'string' && looksLikeDateString(v)
  );
}

/**
 * Check if a string looks like a date.
 */
function looksLikeDateString(str: string): boolean {
  // ISO 8601 date: 2025-01-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return true;

  // ISO 8601 datetime: 2025-01-15T10:30:00Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) return true;

  // Common formats: MM/DD/YYYY, DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return true;

  // Try parsing as date
  const date = new Date(str);
  return !isNaN(date.getTime());
}

/**
 * Check if a string looks like a datetime (has time component).
 */
function looksLikeDateTimeString(str: string): boolean {
  // Has 'T' separator (ISO 8601)
  if (str.includes('T')) return true;

  // Has time pattern HH:MM:SS
  if (/\d{2}:\d{2}:\d{2}/.test(str)) return true;

  return false;
}

/**
 * Check if values look like datetimes (not just dates).
 */
function looksLikeDateTime(values: any[]): boolean {
  return values
    .slice(0, 5)
    .every(v => typeof v === 'string' && looksLikeDateTimeString(v));
}

/**
 * Generate human-readable label from field name.
 * 
 * Examples:
 * - "user_id" → "User ID"
 * - "firstName" → "First Name"
 * - "created_at" → "Created At"
 * - "score" → "Score"
 */
function generateFieldLabel(fieldName: string): string {
  // Split on underscores, hyphens, or camelCase boundaries
  const words = fieldName
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .split(/[_\-\s]+/) // Split on _, -, space
    .filter(Boolean);

  // Capitalize first letter of each word
  const capitalized = words.map(
    word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  return capitalized.join(' ');
}

// ============================================================================
// Helper: Update Schema with New Data
// ============================================================================

/**
 * Update an existing schema with new data samples.
 * 
 * Useful for incremental discovery as more data loads.
 * 
 * @param existingSchema - Previously discovered schema
 * @param newRows - New data samples to incorporate
 * @param config - Optional discovery configuration
 * @returns Updated schema
 */
export function updateSchema(
  existingSchema: DiscoveredSchema,
  newRows: Record<string, any>[],
  config: Partial<DiscoveryConfig> = {}
): DiscoveredSchema {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Combine old and new samples
  const combinedSampleSize = existingSchema.sampleSize + newRows.length;

  // For each existing field, update with new data
  const updatedFields = existingSchema.fields.map(field => {
    // Extract values for this field from new rows
    const newValues: any[] = [];
    let newNullCount = 0;

    for (const row of newRows) {
      const value = row[field.name];
      if (value === null || value === undefined) {
        newNullCount++;
      } else {
        newValues.push(value);
      }
    }

    // Merge sample values (deduplicate)
    const allSampleValues = new Set([
      ...field.sampleValues.map(v => JSON.stringify(v)),
      ...newValues
        .slice(0, finalConfig.maxSampleValues)
        .map(v => JSON.stringify(v)),
    ]);

    const mergedSamples = Array.from(allSampleValues)
      .slice(0, finalConfig.maxSampleValues)
      .map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });

    // Recalculate cardinality
    const newCardinality = allSampleValues.size;

    // Update nullable if new nulls found
    const nullable = field.nullable || newNullCount > 0;

    // Re-infer type with updated cardinality
    const inferredType = inferFieldType(
      mergedSamples,
      newCardinality,
      finalConfig.maxEnumCardinality
    );

    return {
      ...field,
      inferredType,
      sampleValues: mergedSamples,
      nullable,
      cardinality: newCardinality,
    };
  });

  // Check for new fields in new rows
  const existingFieldNames = new Set(existingSchema.fields.map(f => f.name));
  const newFieldNames = extractFieldNames(newRows).filter(
    name => !existingFieldNames.has(name)
  );

  // Discover new fields
  const newFields = newFieldNames.map(fieldName =>
    discoverField(fieldName, newRows, finalConfig)
  );

  return {
    fields: [...updatedFields, ...newFields].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    sampleSize: combinedSampleSize,
    discoveredAt: new Date().toISOString(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { DiscoveryConfig, DiscoveredField };

export {
  DEFAULT_CONFIG as defaultDiscoveryConfig,
  generateFieldLabel,
};
