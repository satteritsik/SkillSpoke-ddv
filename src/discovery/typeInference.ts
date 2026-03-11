/**
 * Runtime Type Inference Heuristics for DynamicDataView.
 * 
 * Provides sophisticated type detection beyond basic JavaScript types:
 * - Pattern-based detection (emails, URLs, IDs, dates)
 * - Statistical analysis for type confidence
 * - Handling of mixed/ambiguous types
 * - Type stability scoring
 * 
 * Per Section 19.3 of COMPREHENSIVE_IMPLEMENTATION_PLAN.md.
 */

import type { InferredType } from '../adapters/DataAdapter';

// ============================================================================
// Type Patterns
// ============================================================================

/**
 * Regular expression patterns for specialized types.
 */
const TYPE_PATTERNS = {
  // IDs
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  prefixedId: /^[a-z]+[_-][\w]+$/i,
  
  // Dates
  isoDate: /^\d{4}-\d{2}-\d{2}$/,
  isoDateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/,
  usDate: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  euroDate: /^\d{1,2}\.\d{1,2}\.\d{4}$/,
  
  // Common formats
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  
  // Technical
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  semver: /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i,
} as const;

// ============================================================================
// Type Confidence Score
// ============================================================================

/**
 * Type inference result with confidence score.
 */
export interface TypeInference {
  /** Inferred type */
  type: InferredType;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Pattern that matched (if any) */
  pattern?: keyof typeof TYPE_PATTERNS;
  
  /** Stability score - how consistent the type is across samples (0-1) */
  stability: number;
  
  /** Sample size used for inference */
  sampleSize: number;
}

// ============================================================================
// Core Inference Functions
// ============================================================================

/**
 * Infer type from array of sample values with confidence scoring.
 * 
 * @param values - Array of sample values (non-null)
 * @param cardinality - Number of distinct values
 * @param maxEnumCardinality - Threshold for enum detection
 * @returns Type inference with confidence score
 */
export function inferTypeWithConfidence(
  values: any[],
  cardinality: number,
  maxEnumCardinality: number = 20
): TypeInference {
  if (values.length === 0) {
    return {
      type: 'unknown',
      confidence: 0,
      stability: 0,
      sampleSize: 0,
    };
  }

  // Count occurrences of each inferred type
  const typeCounts = new Map<InferredType, number>();
  const patternMatches = new Map<keyof typeof TYPE_PATTERNS, number>();
  
  for (const value of values) {
    const result = inferSingleValueType(value);
    typeCounts.set(result.type, (typeCounts.get(result.type) || 0) + 1);
    
    if (result.pattern) {
      patternMatches.set(
        result.pattern,
        (patternMatches.get(result.pattern) || 0) + 1
      );
    }
  }

  // Find dominant type
  let maxCount = 0;
  let dominantType: InferredType = 'unknown';
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  });

  // Calculate stability (what % of samples match dominant type)
  const stability = maxCount / values.length;

  // Calculate confidence based on:
  // 1. Type stability (how consistent)
  // 2. Sample size (more samples = more confident)
  // 3. Pattern match strength (strong patterns = more confident)
  
  const sampleSizeConfidence = Math.min(values.length / 20, 1); // Max out at 20 samples
  const patternConfidence = getBestPatternConfidence(patternMatches, values.length);
  
  const confidence = (
    stability * 0.5 +
    sampleSizeConfidence * 0.3 +
    patternConfidence * 0.2
  );

  // Special case: enum detection with high cardinality reduces confidence
  // TypeScript workaround: dominantType starts as 'unknown' but changes in forEach
  if (dominantType !== 'unknown' && dominantType === 'string' && cardinality <= maxEnumCardinality) {
    const enumConfidence = 1 - (cardinality / maxEnumCardinality) * 0.3;
    return {
      type: 'enum',
      confidence: confidence * enumConfidence,
      stability,
      sampleSize: values.length,
    };
  }

  // Get best matching pattern
  let bestPattern: keyof typeof TYPE_PATTERNS | undefined;
  let bestPatternCount = 0;
  patternMatches.forEach((count, pattern) => {
    if (count > bestPatternCount) {
      bestPatternCount = count;
      bestPattern = pattern;
    }
  });

  return {
    type: dominantType,
    confidence,
    pattern: bestPattern,
    stability,
    sampleSize: values.length,
  };
}

/**
 * Infer type of a single value with pattern matching.
 */
function inferSingleValueType(value: any): {
  type: InferredType;
  pattern?: keyof typeof TYPE_PATTERNS;
} {
  if (value === null || value === undefined) {
    return { type: 'unknown' };
  }

  // Boolean
  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  // Number
  if (typeof value === 'number') {
    return { type: 'number' };
  }

  // String - apply pattern matching
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Check for ID patterns
    if (TYPE_PATTERNS.uuid.test(trimmed)) {
      return { type: 'id', pattern: 'uuid' };
    }
    if (TYPE_PATTERNS.prefixedId.test(trimmed)) {
      return { type: 'id', pattern: 'prefixedId' };
    }
    
    // Check for date/datetime patterns
    if (TYPE_PATTERNS.isoDateTime.test(trimmed)) {
      return { type: 'datetime', pattern: 'isoDateTime' };
    }
    if (TYPE_PATTERNS.isoDate.test(trimmed)) {
      // Could be date or datetime - check if value parses to specific time
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
        return { 
          type: hasTime ? 'datetime' : 'date',
          pattern: 'isoDate'
        };
      }
    }
    if (TYPE_PATTERNS.usDate.test(trimmed) || TYPE_PATTERNS.euroDate.test(trimmed)) {
      return { type: 'date', pattern: 'usDate' };
    }
    
    // Generic date string (try parsing)
    if (looksLikeDateString(trimmed)) {
      const hasTimeComponent = 
        trimmed.includes(':') || 
        trimmed.includes('T') ||
        /\d{2}:\d{2}/.test(trimmed);
      return { type: hasTimeComponent ? 'datetime' : 'date' };
    }
    
    // Default to string
    return { type: 'string' };
  }

  // Arrays and objects
  return { type: 'unknown' };
}

/**
 * Check if string looks like a date.
 */
function looksLikeDateString(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900;
}

/**
 * Calculate confidence from pattern matches.
 */
function getBestPatternConfidence(
  patternMatches: Map<keyof typeof TYPE_PATTERNS, number>,
  totalSamples: number
): number {
  if (patternMatches.size === 0) return 0;
  
  let maxMatches = 0;
  patternMatches.forEach(count => {
    if (count > maxMatches) maxMatches = count;
  });
  
  return maxMatches / totalSamples;
}

// ============================================================================
// Type Refinement
// ============================================================================

/**
 * Refine inferred type based on field name hints.
 * 
 * Some field names strongly suggest specific types:
 * - "email" → email validation
 * - "url", "link" → URL type
 * - "created_at", "updated_at" → datetime
 * - "birth_date", "dob" → date
 * 
 * @param fieldName - Name of the field
 * @param inferredType - Type inferred from values
 * @param confidence - Confidence in inferred type
 * @returns Refined type and confidence
 */
export function refineTypeByFieldName(
  fieldName: string,
  inferredType: InferredType,
  confidence: number
): TypeInference {
  const lowerName = fieldName.toLowerCase();
  
  // Email field
  if (
    lowerName.includes('email') &&
    (inferredType === 'string' || inferredType === 'unknown')
  ) {
    return {
      type: 'string',
      confidence: Math.max(confidence, 0.8),
      stability: 1,
      sampleSize: 1,
    };
  }
  
  // URL/Link field
  if (
    (lowerName.includes('url') || lowerName.includes('link')) &&
    (inferredType === 'string' || inferredType === 'unknown')
  ) {
    return {
      type: 'string',
      confidence: Math.max(confidence, 0.8),
      stability: 1,
      sampleSize: 1,
    };
  }
  
  // DateTime fields (created_at, updated_at, timestamp)
  if (
    (lowerName.includes('_at') ||
      lowerName.includes('timestamp') ||
      lowerName === 'created' ||
      lowerName === 'updated') &&
    (inferredType === 'string' || inferredType === 'unknown' || inferredType === 'date')
  ) {
    return {
      type: 'datetime',
      confidence: Math.max(confidence, 0.85),
      stability: 1,
      sampleSize: 1,
    };
  }
  
  // Date fields (birth_date, dob, date_of_birth)
  if (
    (lowerName.includes('date') ||
      lowerName === 'dob' ||
      lowerName.includes('birthday') ||
      lowerName.includes('birthdate')) &&
    (inferredType === 'string' || inferredType === 'unknown' || inferredType === 'datetime')
  ) {
    return {
      type: 'date',
      confidence: Math.max(confidence, 0.85),
      stability: 1,
      sampleSize: 1,
    };
  }
  
  // ID fields
  if (
    lowerName.endsWith('_id') ||
    lowerName.endsWith('id') ||
    lowerName === 'pk' ||
    lowerName === 'key'
  ) {
    return {
      type: 'id',
      confidence: Math.max(confidence, 0.9),
      stability: 1,
      sampleSize: 1,
    };
  }
  
  // Boolean fields (is_*, has_*, enabled, active)
  if (
    lowerName.startsWith('is_') ||
    lowerName.startsWith('has_') ||
    lowerName === 'enabled' ||
    lowerName === 'active' ||
    lowerName === 'disabled' ||
    lowerName === 'verified'
  ) {
    if (inferredType === 'boolean') {
      return {
        type: 'boolean',
        confidence: Math.max(confidence, 0.9),
        stability: 1,
        sampleSize: 1,
      };
    }
    // Even if not boolean, might be truthy string ("yes"/"no", "true"/"false")
    if (inferredType === 'string' || inferredType === 'enum') {
      return {
        type: 'enum', // Likely binary enum
        confidence: Math.max(confidence, 0.7),
        stability: 1,
        sampleSize: 1,
      };
    }
  }
  
  // Status, state, type fields → likely enums
  if (
    lowerName.includes('status') ||
    lowerName.includes('state') ||
    lowerName.includes('type') ||
    lowerName.includes('category')
  ) {
    if (inferredType === 'string' || inferredType === 'enum') {
      return {
        type: 'enum',
        confidence: Math.max(confidence, 0.75),
        stability: 1,
        sampleSize: 1,
      };
    }
  }
  
  // No refinement needed
  return {
    type: inferredType,
    confidence,
    stability: 1,
    sampleSize: 1,
  };
}

// ============================================================================
// Mixed Type Handling
// ============================================================================

/**
 * Determine best type for mixed-type field.
 * 
 * When a field contains multiple types (e.g., numbers and strings),
 * this decides the best representation.
 * 
 * Strategy:
 * - If >80% one type, use that type
 * - If numbers and strings, prefer string (more permissive)
 * - If booleans and anything else, prefer string/enum
 * 
 * @param typeCounts - Count of each type observed
 * @param totalSamples - Total number of samples
 * @returns Best type and confidence
 */
export function resolveMixedTypes(
  typeCounts: Map<InferredType, number>,
  totalSamples: number
): TypeInference {
  // Find dominant type
  let maxCount = 0;
  let dominantType: InferredType = 'unknown';
  
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  });
  
  const dominantRatio = maxCount / totalSamples;
  
  // If one type is >80%, use that with confidence
  if (dominantRatio >= 0.8) {
    return {
      type: dominantType,
      confidence: dominantRatio,
      stability: dominantRatio,
      sampleSize: totalSamples,
    };
  }
  
  // Mixed numbers and strings → treat as string (can display both)
  const hasNumbers = typeCounts.has('number');
  const hasStrings = typeCounts.has('string');
  if (hasNumbers && hasStrings) {
    return {
      type: 'string',
      confidence: 0.6,
      stability: dominantRatio,
      sampleSize: totalSamples,
    };
  }
  
  // Mixed booleans and strings → treat as enum (likely "yes"/"no" variants)
  const hasBooleans = typeCounts.has('boolean');
  if (hasBooleans && hasStrings) {
    return {
      type: 'enum',
      confidence: 0.5,
      stability: dominantRatio,
      sampleSize: totalSamples,
    };
  }
  
  // Default to dominant type with reduced confidence
  return {
    type: dominantType,
    confidence: dominantRatio * 0.7,
    stability: dominantRatio,
    sampleSize: totalSamples,
  };
}

// ============================================================================
// Type Validation
// ============================================================================

/**
 * Validate if value matches expected type.
 * 
 * Useful for runtime validation during data processing.
 * 
 * @param value - Value to validate
 * @param expectedType - Expected type
 * @returns Whether value matches type
 */
export function validateType(value: any, expectedType: InferredType): boolean {
  if (value === null || value === undefined) {
    return true; // Null/undefined allowed for nullable fields
  }
  
  switch (expectedType) {
    case 'boolean':
      return typeof value === 'boolean';
    
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    
    case 'string':
    case 'enum':
      return typeof value === 'string';
    
    case 'id':
      return (
        typeof value === 'string' ||
        typeof value === 'number'
      );
    
    case 'date':
    case 'datetime':
      if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      if (value instanceof Date) {
        return !isNaN(value.getTime());
      }
      return false;
    
    case 'unknown':
      return true; // Unknown accepts anything
    
    default:
      return true;
  }
}

// ============================================================================
// Type Coercion Suggestions
// ============================================================================

/**
 * Suggest coercion strategy for converting values to target type.
 * 
 * @param fromType - Current inferred type
 * @param toType - Desired target type
 * @returns Coercion strategy or null if not possible
 */
export function suggestCoercion(
  fromType: InferredType,
  toType: InferredType
): string | null {
  // Same type - no coercion needed
  if (fromType === toType) return null;
  
  // To string - almost always possible
  if (toType === 'string') {
    return 'String(value)';
  }
  
  // To number
  if (toType === 'number') {
    if (fromType === 'string') return 'parseFloat(value)';
    if (fromType === 'boolean') return 'value ? 1 : 0';
    return null;
  }
  
  // To boolean
  if (toType === 'boolean') {
    if (fromType === 'string') {
      return 'value.toLowerCase() === "true" || value === "1"';
    }
    if (fromType === 'number') return 'value !== 0';
    return null;
  }
  
  // To date/datetime
  if (toType === 'date' || toType === 'datetime') {
    if (fromType === 'string') return 'new Date(value)';
    if (fromType === 'number') return 'new Date(value)'; // Timestamp
    return null;
  }
  
  // Other conversions not supported
  return null;
}

// ============================================================================
// Exports
// ============================================================================

export {
  TYPE_PATTERNS,
};
