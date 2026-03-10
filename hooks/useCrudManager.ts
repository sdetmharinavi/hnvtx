// hooks/useCrudManager.ts
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Filters,
  PublicTableName,
  PublicTableOrViewName,
  PagedQueryResult,
} from '@/hooks/database';
import { useOnlineStatus } from './useOnlineStatus';
import { DEFAULTS } from '@/constants/constants';
import { UseQueryResult } from '@tanstack/react-query';
import { useDataSync } from '@/hooks/data/useDataSync';

export type RecordWithId = {
  id: string | number | null;
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  employee_name?: string | null;
  [key: string]: unknown;
};

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
  [key: string]: unknown;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;
type BaseRecord = { id: string | number | null; [key: string]: unknown };

export interface CrudManagerOptions<T extends PublicTableName, V extends BaseRecord> {
  tableName: T;
  localTableName?: PublicTableOrViewName;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: (keyof V & string) | (keyof V & string)[];
  displayNameField?: (keyof V & string) | (keyof V & string)[];
  idType?: 'string' | 'number';
  initialFilters?: Filters;
  syncTables?: PublicTableOrViewName[];
}

export interface UseCrudManagerReturn<V> {
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
  utils: {
    getDisplayName: (record: RecordWithId) => string;
  };
}

export function useCrudManager<T extends PublicTableName, V extends BaseRecord>({
  dataQueryHook,
  searchColumn,
  displayNameField = 'name',
  initialFilters = {},
  syncTables,
}: CrudManagerOptions<T, V>): UseCrudManagerReturn<V> {
  const isOnline = useOnlineStatus();
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();

  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const[pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const[isViewModalOpen, setIsViewModalOpen] = useState(false);

  const combinedFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (searchQuery && searchColumn) {
      if (Array.isArray(searchColumn)) {
        newFilters.or = searchColumn.reduce(
          (acc, col) => {
            acc[col as string] = searchQuery;
            return acc;
          },
          {} as Record<string, string>,
        );
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
    if (isOnline && syncTables && syncTables.length > 0) {
      await syncData(syncTables);
    } else {
      refetch();
    }
  }, [isOnline, syncTables, syncData, refetch]);

  const openViewModal = useCallback((record: V) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  },[]);

  const closeModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingRecord(null);
  },[]);

  const getDisplayName = useCallback(
    (record: RecordWithId): string => {
      if (displayNameField) {
        const fields = Array.isArray(displayNameField) ? displayNameField :[displayNameField];
        for (const field of fields) {
          const name = record[field as string];
          if (name) return String(name);
        }
      }
      if (record.name) return String(record.name);
      if (record.employee_name) return String(record.employee_name);
      if (record.first_name && record.last_name) return `${record.first_name} ${record.last_name}`;
      if (record.first_name) return String(record.first_name);
      return String(record.id) || 'Unknown';
    },
    [displayNameField],
  );

  const queryResult = useMemo(
    () =>
      ({
        data: { data, count: totalCount },
        isLoading,
        isPending: isLoading,
        isFetching: isFetching || isSyncingData,
        error: error as Error | null,
        isError: !!error,
        isSuccess: !isLoading && !error,
        refetch: handleRefresh as unknown as () => Promise<PagedQueryResult<V>>,
        status: isLoading ? 'pending' : error ? 'error' : 'success',
      }) as unknown as UseQueryResult<PagedQueryResult<V>, Error>,[data, totalCount, isLoading, isFetching, isSyncingData, error, handleRefresh],
  );

  return {
    data: data ||[],
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
    queryResult,
    viewModal: {
      isOpen: isViewModalOpen,
      record: viewingRecord,
      open: openViewModal,
      close: closeModal,
    },
    utils: { getDisplayName },
  };
}