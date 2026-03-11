
import type { DiscoveredField } from '../discovery/fieldDiscovery';

/**
 * Type Vault plugin configuration.
 * Maps field names to Type Vault type names.
 */
export interface TypeVaultPluginConfig {
  /**
   * Map of field name to Type Vault type name.
   * Example: { 'status': 'OpportunityStatus', 'verdict': 'OpportunityVerdict' }
   */
  fields: Record<string, string>;
  
  /**
   * Type Vault API base URL.
   * Example: 'https://api.skillspoke.com/type-vault'
   */
  apiBaseUrl: string;
  
  /**
   * Optional authentication token for Type Vault API.
   */
  authToken?: string;
}

/**
 * Type Vault plugin interface for DynamicDataView.
 * 
 * Allows DynamicDataView to optionally use Type Vault for enum values
 * instead of local discovery. This is an enhancement, not a requirement.
 */
export interface TypeVaultPlugin {
  /**
   * Check if a field should use Type Vault instead of local enum discovery.
   * 
   * @param field - The discovered field to check
   * @returns true if Type Vault should be used for this field
   */
  shouldUseTypeVault(field: DiscoveredField): boolean;
  
  /**
   * Fetch enum values from Type Vault for a specific field.
   * 
   * @param fieldName - Name of the field
   * @returns Array of valid string values from Type Vault
   */
  getEnumValues(fieldName: string): Promise<string[]>;
  
  /**
   * Validate a value against Type Vault.
   * 
   * @param fieldName - Name of the field
   * @param value - Value to validate
   * @returns true if value is valid according to Type Vault
   */
  validateValue(fieldName: string, value: any): Promise<boolean>;
  
  /**
   * Get the Type Vault type name for a field.
   * 
   * @param fieldName - Name of the field
   * @returns Type Vault type name, or null if field not mapped
   */
  getTypeName(fieldName: string): string | null;
}

/**
 * Create a Type Vault plugin instance.
 * 
 * @param config - Plugin configuration
 * @returns TypeVaultPlugin instance
 * 
 * @example
 * ```typescript
 * const plugin = createTypeVaultPlugin({
 *   fields: {
 *     'status': 'OpportunityStatus',
 *     'verdict': 'OpportunityVerdict',
 *     'work_mode': 'WorkMode'
 *   },
 *   apiBaseUrl: 'https://api.skillspoke.com/type-vault',
 *   authToken: getAuthToken()
 * });
 * 
 * // Use with DynamicDataView
 * <DynamicDataViewPanel adapter={adapter} plugins={[plugin]} />
 * ```
 */
export function createTypeVaultPlugin(config: TypeVaultPluginConfig): TypeVaultPlugin {
  // Cache for enum values to avoid repeated API calls
  const enumCache = new Map<string, { values: string[]; timestamp: number }>();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  
  return {
    shouldUseTypeVault(field: DiscoveredField): boolean {
      // Check if this field is mapped to a Type Vault type
      return field.name in config.fields;
    },
    
    async getEnumValues(fieldName: string): Promise<string[]> {
      const typeName = config.fields[fieldName];
      if (!typeName) {
        return [];
      }
      
      // Check cache
      const cached = enumCache.get(typeName);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.values;
      }
      
      // Fetch from Type Vault API
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (config.authToken) {
          headers['Authorization'] = config.authToken;
        }
        
        const response = await fetch(`${config.apiBaseUrl}/types/${typeName}`, {
          headers,
        });
        
        if (!response.ok) {
          console.warn(`Type Vault API error for ${typeName}:`, response.status);
          return [];
        }
        
        const typeData = await response.json();
        const values = typeData.values?.map((v: any) => v.value || v) || [];
        
        // Cache the result
        enumCache.set(typeName, {
          values,
          timestamp: Date.now(),
        });
        
        return values;
      } catch (error) {
        console.error(`Failed to fetch Type Vault values for ${typeName}:`, error);
        return [];
      }
    },
    
    async validateValue(fieldName: string, value: any): Promise<boolean> {
      const validValues = await this.getEnumValues(fieldName);
      return validValues.includes(String(value));
    },
    
    getTypeName(fieldName: string): string | null {
      return config.fields[fieldName] || null;
    },
  };
}
