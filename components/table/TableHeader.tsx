// @/components/table/TableHeader.tsx
import React from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { DataTableProps, SortConfig } from "@/components/table/datatable-types";
import { Row, TableOrViewName } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";

interface TableHeaderProps<T extends TableOrViewName>
  extends Pick<
    DataTableProps<T>,
    "columns" | "selectable" | "sortable" | "bordered" | "density" | "actions"
  > {
  visibleColumns: Column<Row<T>>[];
  hasActions: boolean;
  sortConfig: SortConfig<Row<T>> | null;
  onSort: (key: keyof Row<T> & string) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
  hasData: boolean;
}


const densityClasses = {
  compact: "py-1 px-2 sm:px-3",
  default: "py-2 px-3 sm:py-3 sm:px-4",
  comfortable: "py-3 px-4 sm:py-4 sm:px-6",
};

function TableHeaderBase<
  T extends TableOrViewName
>({
  visibleColumns,
  selectable,
  sortable,
  bordered,
  density,
  hasActions,
  sortConfig,
  onSort,
  onSelectAll,
  allSelected,
  hasData,
}: TableHeaderProps<T>) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
      <tr>
        {selectable && (
          <th
            className={`w-12 px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap overflow-hidden ${
              bordered
                ? "border-b border-r border-gray-200 dark:border-gray-700"
                : ""
            }`}
            style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          >
            <input
              type="checkbox"
              checked={allSelected && hasData}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label="Select all rows"
            />
          </th>
        )}
        {hasActions && (
          <th
            className={`w-32 text-center whitespace-nowrap overflow-hidden ${
              densityClasses[density ?? "default"]
            } text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
              bordered ? "border-b border-gray-200 dark:border-gray-700" : ""
            }`}
            style={{ width: 128, minWidth: 128, maxWidth: 128 }}
          >
            <span className="hidden sm:inline">Actions</span>
            <span className="sm:hidden">•••</span>
          </th>
        )}
        {visibleColumns.map((column, index) => (
          <th
            key={column.key}
            className={`${
              densityClasses[density ?? "default"]
            } text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap ${
              column.sortable && sortable
                ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                : ""
            } ${
              column.align === "center"
                ? "text-center"
                : column.align === "right"
                ? "text-right"
                : ""
            } ${
              bordered
                ? `border-b ${
                    index < visibleColumns.length - 1 || hasActions
                      ? "border-r"
                      : ""
                  } border-gray-200 dark:border-gray-700`
                : ""
            }`}
            style={{
              width: column.width,
              minWidth: column.width ? undefined : "100px",
              maxWidth: "350px"
            }}
            onClick={() =>
              column.sortable &&
              sortable &&
              onSort(column.dataIndex as keyof Row<T> & string)
            }
          >
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <TruncateTooltip
                  text={column.title}
                  id={`header-${column.key}`}
                  className="text-xs sm:text-sm"
                />
              </div>

              {column.sortable && sortable && (
                <div className="flex flex-col flex-shrink-0" aria-hidden="true">
                  <FiArrowUp
                    size={10}
                    className={`sm:size-3 ${
                      sortConfig?.key === column.dataIndex &&
                      sortConfig.direction === "asc"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                  <FiArrowDown
                    size={10}
                    className={`-mt-0.5 sm:size-3 sm:-mt-1 ${
                      sortConfig?.key === column.dataIndex &&
                      sortConfig.direction === "desc"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const TableHeader = React.memo(TableHeaderBase) as <T extends TableOrViewName>(
  props: TableHeaderProps<T>
) => React.ReactElement;
