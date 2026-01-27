// hooks/crud/useCrudState.ts
import { useState, useCallback, useEffect } from 'react';
import { Filters } from '@/hooks/database';
import { DEFAULTS } from '@/constants/constants';
import { CrudStateOptions } from './types';

export interface UseCrudStateReturn {
  pagination: {
    currentPage: number;
    pageLimit: number;
    setCurrentPage: (page: number) => void;
    setPageLimit: (limit: number) => void;
  };
  search: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
  };
  filters: {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  };
  selection: {
    selectedRowIds: string[];
    setSelectedRowIds: (ids: string[]) => void;
    handleClearSelection: () => void;
  };
}

export function useCrudState({
  initialFilters = {},
  defaultPageSize = DEFAULTS.PAGE_SIZE,
}: CrudStateOptions = {}): UseCrudStateReturn {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(defaultPageSize);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  // THE FIX: Explicitly typed useState to match the Filters interface.
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Callbacks
  const handleClearSelection = useCallback(() => setSelectedRowIds([]), []);

  // Effects: Reset page when search or filters change to avoid empty states
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  return {
    pagination: {
      currentPage,
      pageLimit,
      setCurrentPage,
      setPageLimit,
    },
    search: {
      searchQuery,
      setSearchQuery,
    },
    filters: {
      filters,
      setFilters,
    },
    selection: {
      selectedRowIds,
      setSelectedRowIds,
      handleClearSelection,
    },
  };
}