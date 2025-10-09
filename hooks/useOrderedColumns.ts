import { useMemo } from 'react';

const useOrderedColumns = <T extends { key: string | number | boolean }>(
  columns: T[],
  desiredOrder: Array<string | number | boolean>
): T[] => {
  return useMemo(() => {
    // Normalize comparison values to strings for consistent comparison
    const normalizeKey = (key: string | number | boolean): string => {
      if (typeof key === 'boolean') return String(key);
      if (typeof key === 'number') return String(key);
      return key;
    };

    // Create a Set of normalized desired keys for efficient lookup
    const desiredOrderSet = new Set(desiredOrder.map(normalizeKey));

    // Order columns according to desiredOrder
    const ordered = desiredOrder
      .map(desiredKey => {
        const normalizedDesiredKey = normalizeKey(desiredKey);
        return columns.find(col => normalizeKey(col.key) === normalizedDesiredKey);
      })
      .filter((col): col is T => col !== undefined);
    
    // Get remaining columns that aren't in desiredOrder
    const remaining = columns.filter(
      col => !desiredOrderSet.has(normalizeKey(col.key))
    );
    
    return [...ordered, ...remaining];
  }, [columns, desiredOrder]);
};

export default useOrderedColumns;