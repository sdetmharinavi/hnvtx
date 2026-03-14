// hooks/useCrudManager.ts
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Filters, PagedQueryResult, PublicTableOrViewName } from '@/hooks/database';
import { useOnlineStatus } from './useOnlineStatus';
import { DEFAULTS } from '@/constants/constants';
import { UseQueryResult } from '@tanstack/react-query';
import { useDataSync } from '@/hooks/data/useDataSync';

export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  error: Error | null;
  refetch: () => void;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;
type BaseRecord = { id: string | number | null; [key: string]: unknown };

export interface ViewManagerOptions<T extends PublicTableOrViewName, V extends BaseRecord> {
  tableName: T;
  localTableName?: string;
  idType?: 'string' | 'number';
  displayNameField?: keyof V & string;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: (keyof V & string) | (keyof V & string)[];
  initialFilters?: Filters;
  syncTables?: string[];
}

export interface UseViewManagerReturn<V extends BaseRecord> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
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
  queryResult: UseQueryResult<PagedQueryResult<V>, Error>;
  viewModal: {
    isOpen: boolean;
    record: V | null;
    open: (record: V) => void;
    close: () => void;
  };
}

export function useCrudManager<T extends PublicTableOrViewName, V extends BaseRecord>({
  dataQueryHook,
  searchColumn,
  initialFilters = {},
  syncTables = [],
}: ViewManagerOptions<T, V>): UseViewManagerReturn<V> {
  const isOnline = useOnlineStatus();
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();

  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const combinedFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (searchQuery && searchColumn) {
      if (Array.isArray(searchColumn)) {
        // FIX: Explicitly type the accumulator for the reduce function
        newFilters.or = searchColumn.reduce<Record<string, string>>((acc, col) => {
          acc[col] = searchQuery;
          return acc;
        }, {});
      } else {
        newFilters[searchColumn as string] = { operator: 'ilike', value: `%${searchQuery}%` };
      }
    }
    return newFilters;
  }, [searchQuery, filters, searchColumn]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const { data, totalCount, activeCount, inactiveCount, isLoading, isFetching, error, refetch } =
    dataQueryHook({
      currentPage,
      pageLimit,
      searchQuery,
      filters: combinedFilters,
    });

  const handleRefresh = useCallback(async () => {
    if (isOnline && syncTables.length > 0) {
      await syncData(syncTables);
    } else {
      refetch();
    }
  }, [isOnline, syncTables, syncData, refetch]);

  // Create a proper query result object to satisfy UseQueryResult interface
  const queryResult = {
    data: { data, count: totalCount },
    isLoading,
    isFetching: isFetching || isSyncingData,
    error,
    isError: !!error,
    refetch: async () => { handleRefresh(); return { data, count: totalCount }; },
  } as unknown as UseQueryResult<PagedQueryResult<V>, Error>;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching: isFetching || isSyncingData,
    error,
    refetch: handleRefresh,
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    viewModal: {
      isOpen: isViewModalOpen,
      record: viewingRecord,
      open: (rec) => { setViewingRecord(rec); setIsViewModalOpen(true); },
      close: () => { setViewingRecord(null); setIsViewModalOpen(false); },
    },
    queryResult,
  };
}