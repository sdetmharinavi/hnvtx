import { useState, useCallback } from 'react';

interface UseSelectionReturn<T> {
  selectedItems: Set<T>;
  selectedCount: number;
  toggleSelection: (id: T) => void;
  toggleAllSelection: (allIds: T[]) => void;
  setSelectedItems: (ids: T[]) => void;
  clearSelection: () => void;
  isSelected: (id: T) => boolean;
  isAllSelected: (allIds: T[]) => boolean;
  isIndeterminate: (allIds: T[]) => boolean;
}

export function useSelection<T = string>(): UseSelectionReturn<T> {
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set());

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Toggle single item selection
  const toggleSelection = useCallback((id: T) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Set selected items
  const setSelected = useCallback((ids: T[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  // Toggle all items selection
  const toggleAllSelection = useCallback((allIds: T[]) => {
    setSelectedItems(prev => {
      if (prev.size === allIds.length && allIds.length > 0) {
        return new Set(); // Clear all if all are selected
      } else {
        return new Set(allIds); // Select all
      }
    });
  }, []);

  // Check if item is selected
  const isSelected = useCallback((id: T) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  // Check if all items are selected
  const isAllSelected = useCallback((allIds: T[]) => {
    return allIds.length > 0 && selectedItems.size === allIds.length;
  }, [selectedItems]);

  // Check if selection is indeterminate (some but not all selected)
  const isIndeterminate = useCallback((allIds: T[]) => {
    return selectedItems.size > 0 && selectedItems.size < allIds.length;
  }, [selectedItems]);

  return {
    selectedItems,
    selectedCount: selectedItems.size,
    toggleSelection,
    toggleAllSelection,
    setSelectedItems: setSelected,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}