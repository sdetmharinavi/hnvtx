// hooks/crud/types.ts
import { PublicTableName, PublicTableOrViewName, TableInsert, TableInsertWithDates, Filters, PagedQueryResult } from '@/hooks/database';
import { UseQueryResult } from '@tanstack/react-query';

export type BaseRecord = {
  id?: string | number | null;
  [key: string]: unknown; // Index signature to allow for other properties
};

// For Display Utils that need a name property
export type RecordWithId = BaseRecord & {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  employee_name?: string | null;
};

// --- Data Fetching Hook Types ---

export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V extends BaseRecord> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  error: Error | null;
  refetch: () => void;
  [key: string]: unknown; // Allow for extra properties returned by specific hooks
}

export type DataQueryHook<V extends BaseRecord> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

// --- Main Hook Options & Return Type ---

export interface CrudManagerOptions<T extends PublicTableName, V extends BaseRecord> {
  tableName: T;
  localTableName?: PublicTableOrViewName;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: (keyof V & string) | (keyof V & string)[];
  displayNameField?: (keyof V & string) | (keyof V & string)[];
  processDataForSave?: (data: TableInsertWithDates<T>) => TableInsert<T>;
  idType?: 'string' | 'number';
  initialFilters?: Filters;
  syncTables?: PublicTableOrViewName[];
}

export interface CrudStateOptions {
  initialFilters?: Filters;
  defaultPageSize?: number;
}

export interface UseCrudManagerReturn<V extends BaseRecord> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  isMutating: boolean;
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
  editModal: {
    isOpen: boolean;
    record: V | null;
    openAdd: () => void;
    openEdit: (record: V) => void;
    close: () => void;
  };
  viewModal: {
    isOpen: boolean;
    record: V | null;
    open: (record: V) => void;
    close: () => void;
  };
  actions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSave: (formData: any) => Promise<void>;
    handleDelete: (record: V) => Promise<void>;
    handleToggleStatus: (record: V) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleCellEdit: (record: V, column: any, newValue: string) => Promise<void>;
  };
  bulkActions: {
    selectedRowIds: string[];
    selectedCount: number;
    handleBulkDelete: () => Promise<void>;
    handleBulkDeleteByFilter: (column: string, value: unknown, displayName: string) => void;
    handleBulkUpdateStatus: (status: 'active' | 'inactive') => Promise<void>;
    handleClearSelection: () => void;
    handleRowSelect: (rows: V[]) => void;
  };
  deleteModal: {
    isOpen: boolean;
    message: string | React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
  };
  utils: {
    getDisplayName: (record: V) => string;
  };
  [key: string]: unknown;
}