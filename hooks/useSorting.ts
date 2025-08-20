import { useMemo, useState, useCallback } from 'react';

// Types
export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

export interface SortOptions {
  caseSensitive?: boolean;
  numericSort?: boolean;
  locale?: string;
}

export interface UseSortingProps<T> {
  data: T[];
  defaultSortKey?: keyof T | string;
  defaultDirection?: SortDirection;
  options?: SortOptions;
}

export interface UseSortingReturn<T> {
  sortedData: T[];
  sortConfig: SortConfig<T>;
  setSortConfig: (config: SortConfig<T>) => void;
  handleSort: (key: keyof T | string) => void;
  resetSort: () => void;
  isSorted: boolean;
  getSortDirection: (key: keyof T | string) => SortDirection;
}

// Union type for supported sortable values
type SortableValue = string | number | Date | boolean | null | undefined;

// Helper function to get nested property value
function getNestedValue(obj: Record<string, unknown>, path: string): SortableValue {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  // Type guard to ensure we return only sortable values
  if (
    typeof current === 'string' ||
    typeof current === 'number' ||
    typeof current === 'boolean' ||
    current instanceof Date ||
    current === null ||
    current === undefined
  ) {
    return current as SortableValue;
  }
  
  // Convert other types to string for comparison
  return String(current);
}

// Helper function to compare values
function compareValues(
  a: SortableValue, 
  b: SortableValue, 
  direction: SortDirection, 
  options: SortOptions = {}
): number {
  const { caseSensitive = false, numericSort = true, locale = 'en' } = options;
  
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'asc' ? -1 : 1;
  if (b == null) return direction === 'asc' ? 1 : -1;

  // Handle different data types
  if (typeof a === 'string' && typeof b === 'string') {
    const valueA = caseSensitive ? a : a.toLowerCase();
    const valueB = caseSensitive ? b : b.toLowerCase();
    
    // Use localeCompare for proper string sorting
    const result = valueA.localeCompare(valueB, locale, {
      numeric: numericSort,
      sensitivity: caseSensitive ? 'case' : 'base'
    });
    
    return direction === 'asc' ? result : -result;
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    const result = a - b;
    return direction === 'asc' ? result : -result;
  }

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    const result = a.getTime() - b.getTime();
    return direction === 'asc' ? result : -result;
  }

  // Handle boolean values
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    const result = Number(a) - Number(b);
    return direction === 'asc' ? result : -result;
  }

  // Fallback to string comparison for mixed types
  const stringA = String(a);
  const stringB = String(b);
  const result = stringA.localeCompare(stringB, locale, {
    numeric: numericSort,
    sensitivity: caseSensitive ? 'case' : 'base'
  });
  
  return direction === 'asc' ? result : -result;
}

// Main sorting hook
export function useSorting<T extends Record<string, unknown>>({
  data,
  defaultSortKey,
  defaultDirection = 'asc',
  options = {}
}: UseSortingProps<T>): UseSortingReturn<T> {
  
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSortKey || '',
    direction: defaultSortKey ? defaultDirection : null
  });

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || !data.length) {
      return data;
    }

    return [...data].sort((a, b) => {
      const valueA = getNestedValue(a, String(sortConfig.key));
      const valueB = getNestedValue(b, String(sortConfig.key));
      
      return compareValues(valueA, valueB, sortConfig.direction, options);
    });
  }, [data, sortConfig, options]);

  // Handle sort column click
  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Cycle through: asc -> desc -> null -> asc
        switch (prevConfig.direction) {
          case 'asc':
            return { key, direction: 'desc' };
          case 'desc':
            return { key: '', direction: null };
          default:
            return { key, direction: 'asc' };
        }
      } else {
        // New column, start with ascending
        return { key, direction: 'asc' };
      }
    });
  }, []);

  // Reset sorting
  const resetSort = useCallback(() => {
    setSortConfig({ key: '', direction: null });
  }, []);

  // Check if currently sorted
  const isSorted = Boolean(sortConfig.key && sortConfig.direction);

  // Get sort direction for a specific key
  const getSortDirection = useCallback((key: keyof T | string): SortDirection => {
    return sortConfig.key === key ? sortConfig.direction : null;
  }, [sortConfig]);

  return {
    sortedData,
    sortConfig,
    setSortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection
  };
}

// Additional utility hooks for specific use cases

// Hook for multi-column sorting
export interface MultiSortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
  priority: number;
}

export function useMultiSorting<T extends Record<string, unknown>>(
  data: T[], 
  options: SortOptions = {}
) {
  const [sortConfigs, setSortConfigs] = useState<MultiSortConfig<T>[]>([]);

  const sortedData = useMemo(() => {
    if (!sortConfigs.length || !data.length) return data;

    return [...data].sort((a, b) => {
      for (const config of sortConfigs.sort((x, y) => x.priority - y.priority)) {
        if (!config.direction) continue;
        
        const valueA = getNestedValue(a, String(config.key));
        const valueB = getNestedValue(b, String(config.key));
        
        const result = compareValues(valueA, valueB, config.direction, options);
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [data, sortConfigs, options]);

  const addSort = useCallback((key: keyof T | string, direction: SortDirection) => {
    if (!direction) return;
    
    setSortConfigs(prev => {
      const existing = prev.find(config => config.key === key);
      if (existing) {
        return prev.map(config => 
          config.key === key 
            ? { ...config, direction }
            : config
        );
      }
      return [...prev, { key, direction, priority: prev.length }];
    });
  }, []);

  const removeSort = useCallback((key: keyof T | string) => {
    setSortConfigs(prev => prev.filter(config => config.key !== key));
  }, []);

  const clearSort = useCallback(() => {
    setSortConfigs([]);
  }, []);

  return {
    sortedData,
    sortConfigs,
    addSort,
    removeSort,
    clearSort
  };
}

// Hook for search + sort combination
export function useSearchAndSort<T extends Record<string, unknown>>(
  data: T[],
  searchKeys: (keyof T | string)[],
  sortOptions: SortOptions = {}
) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter(item => 
      searchKeys.some(key => {
        const value = getNestedValue(item, String(key));
        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchKeys]);

  // Apply sorting to filtered data
  const sortingResult = useSorting({
    data: filteredData,
    options: sortOptions
  });

  return {
    ...sortingResult,
    searchTerm,
    setSearchTerm,
    filteredCount: filteredData.length,
    totalCount: data.length
  };
}

// Utility type for extracting sortable keys from an object type
export type SortableKeys<T> = {
  [K in keyof T]: T[K] extends SortableValue ? K : never;
}[keyof T];

// Hook with strongly typed keys (optional, for better type safety)
export function useTypedSorting<T extends Record<string, unknown>>(
  data: T[],
  defaultSortKey?: SortableKeys<T>,
  defaultDirection: SortDirection = 'asc',
  options: SortOptions = {}
) {
  return useSorting({
    data,
    defaultSortKey,
    defaultDirection,
    options
  });
}