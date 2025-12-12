// @/components/table/types.ts
import { TableOrViewName, Row, Filters } from "@/hooks/database";
import { Column, RPCConfig, ExcelStyles } from "@/hooks/database/excel-queries/excel-helpers";

export interface TableAction<T extends TableOrViewName> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  getIcon?: (record: Row<T>) => React.ReactNode;
  onClick: (record: Row<T>, index?: number) => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean | ((record: Row<T>) => boolean);
  hidden?: boolean | ((record: Row<T>) => boolean);
  [key: string]: unknown;
}

export interface DownloadOptions<T extends TableOrViewName> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}

export interface DataTableProps<T extends TableOrViewName> {
  data: Row<T>[];
  tableName: T;
  columns: Column<Row<T>>[];
  loading?: boolean;
  isFetching?: boolean;
  showColumnSelector?: boolean;
  showColumnsToggle?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange: (page: number, pageSize: number) => void;
  };
  actions?: TableAction<T>[];
  searchable?: boolean;
  serverSearch?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  density?: "compact" | "default" | "comfortable";
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  emptyText?: string;
  title?: string;
  onRefresh?: () => void;
  onSearchChange?: (query: string) => void;
  onExport?: (data: Row<T>[], columns: Column<Row<T>>[]) => void | Promise<void>;
  onRowSelect?: (selectedRows: Row<T>[]) => void;
  onCellEdit?: (record: Row<T>, column: Column<Row<T>>, newValue: string) => void;
  customToolbar?: React.ReactNode;
  exportOptions?: {
    fileName?: string;
    sheetName?: string;
    includeFilters?: boolean;
    maxRows?: number;
    rpcConfig?: RPCConfig;
    fallbackToCsv?: boolean;
  } & Omit<DownloadOptions<T>, "rpcConfig">;
  renderMobileItem?: (record: Row<T>, actions: React.ReactNode) => React.ReactNode;
  
  // NEW PROP
  autoHideEmptyColumns?: boolean; 
}

export type SortDirection = "asc" | "desc";
export interface SortConfig<T> {
  key: keyof T & string;
  direction: SortDirection;
}

export type TablePaginationProps = Pick<DataTableProps<TableOrViewName>, 'pagination' | 'bordered'>;