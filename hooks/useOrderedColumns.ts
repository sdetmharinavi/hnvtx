import { useMemo } from 'react';

const useOrderedColumns = <T extends { key: string }>(
  columns: T[],
  desiredOrder: string[]
): T[] => {
  return useMemo(() => {
    const ordered = desiredOrder
      .map(key => columns.find(col => col.key === key))
      .filter((col): col is T => col !== undefined);
    
    const remaining = columns.filter(col => !desiredOrder.includes(col.key));
    
    return [...ordered, ...remaining];
  }, [columns, desiredOrder]);
};

export default useOrderedColumns;