// hooks/useDuplicateFinder.ts
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';

interface UseDuplicateFinderReturn {
  showDuplicates: boolean;
  toggleDuplicates: () => void;
  duplicateSet: Set<string>;
  duplicateCount: number;
}

export function useDuplicateFinder<T>(
  data: T[],
  // CHANGED: Accept either a key string OR a function to generate the unique key
  identity: keyof T | ((item: T) => string),
  entityName: string = 'records'
): UseDuplicateFinderReturn {
  const [showDuplicates, setShowDuplicates] = useState(false);

  // 1. Pure Calculation (No Side Effects here)
  const { duplicateSet, duplicateCount } = useMemo(() => {
    const emptyResult = { duplicateSet: new Set<string>(), duplicateCount: 0 };

    // Optimization: Don't calculate if feature is off or no data
    if (!showDuplicates || !data || data.length === 0) {
      return emptyResult;
    }

    const counts = new Map<string, number>();

    // Count occurrences
    data.forEach((item) => {
      let key = '';

      // Determine the key based on the identity prop type
      if (typeof identity === 'function') {
        key = identity(item);
      } else {
        const val = item[identity];
        // Ensure we only process valid strings/numbers
        if (val !== null && val !== undefined) {
          key = String(val);
        }
      }

      if (key && key.trim() !== '') {
        const normalizedKey = key.trim(); // Case-sensitive check usually preferred for IDs, but logic depends on input
        counts.set(normalizedKey, (counts.get(normalizedKey) || 0) + 1);
      }
    });

    // Filter duplicates
    const duplicates = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) duplicates.add(key);
    });

    return { duplicateSet: duplicates, duplicateCount: duplicates.size };
  }, [data, showDuplicates, identity]);

  // 2. Side Effect: Handle Toasts safely
  useEffect(() => {
    const toastId = `duplicate-finder-${entityName.replace(/\s+/g, '-').toLowerCase()}`;

    if (showDuplicates) {
      if (duplicateCount === 0) {
        toast.info(`No duplicate ${entityName} found.`, { id: toastId });
      } else {
        toast.warning(`Found ${duplicateCount} duplicate ${entityName}.`, { id: toastId });
      }
    } else {
      toast.dismiss(toastId);
    }
  }, [showDuplicates, duplicateCount, entityName]);

  const toggleDuplicates = () => setShowDuplicates((prev) => !prev);

  return {
    showDuplicates,
    toggleDuplicates,
    duplicateSet,
    duplicateCount,
  };
}
