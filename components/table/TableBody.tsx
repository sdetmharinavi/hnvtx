// components/table/TableBody.tsx
import React from 'react';
import { DataTableProps, TableAction } from '@/components/table/datatable-types';
import { TableOrViewName, Row } from '@/hooks/database';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { TruncateTooltip } from '@/components/common/TruncateTooltip';
import { TableSkeleton } from '@/components/common/ui/table/TableSkeleton';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { cn } from '@/lib/utils';

type DataRow<T extends TableOrViewName> = Row<T> & { id: string | number };

interface TableBodyProps<T extends TableOrViewName> extends Pick<
  DataTableProps<T>,
  | 'columns'
  | 'selectable'
  | 'bordered'
  | 'density'
  | 'striped'
  | 'hoverable'
  | 'loading'
  | 'emptyText'
> {
  actions?: TableAction<T>[];
  processedData: DataRow<T>[];
  visibleColumns: Column<Row<T>>[];
  hasActions: boolean;
  selectedRows: DataRow<T>[];
  onRowSelect?: (record: DataRow<T>, selected: boolean) => void;
}

interface TableRowProps<T extends TableOrViewName> extends Omit<
  TableBodyProps<T>,
  'processedData' | 'loading' | 'emptyText'
> {
  record: DataRow<T>;
  rowIndex: number;
  isSelected: boolean;
}

const densityClasses = { compact: 'py-1 px-3', default: 'py-3 px-4', comfortable: 'py-4 px-6' };

function TableRowBase<T extends TableOrViewName>({
  record,
  rowIndex,
  isSelected,
  visibleColumns,
  selectable,
  bordered,
  density,
  actions,
  hasActions,
  striped,
  hoverable,
  onRowSelect,
}: TableRowProps<T>) {
  const isStriped = striped && rowIndex % 2 === 1;
  const trClasses = cn(
    'group transition-colors',
    hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
    isStriped && 'bg-gray-50/50 dark:bg-gray-700/25',
    isSelected && 'bg-blue-50 dark:bg-blue-900/20',
  );

  const stickyTdClasses = cn(
    'sticky right-0 z-10 text-center whitespace-nowrap transition-colors',
    densityClasses[density ?? 'default'],
    isSelected
      ? 'bg-blue-50 dark:bg-blue-900/20'
      : isStriped
        ? 'bg-gray-50 dark:bg-gray-700/25'
        : 'bg-white dark:bg-gray-800',
    hoverable && 'group-hover:bg-gray-100 dark:group-hover:bg-gray-700',
    isSelected && hoverable && 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40',
    bordered
      ? 'border-b border-l border-gray-200 dark:border-gray-700'
      : 'shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]',
  );

  return (
    <tr className={trClasses}>
      {selectable && (
        <td
          className={cn(
            'sticky left-0 z-10 w-12 px-4 py-3 whitespace-nowrap overflow-hidden transition-colors',
            isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : isStriped
                ? 'bg-gray-50 dark:bg-gray-700/25'
                : 'bg-white dark:bg-gray-800',
            hoverable && 'group-hover:bg-gray-100 dark:group-hover:bg-gray-700',
            isSelected && hoverable && 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40',
            bordered ? `border-b border-r border-gray-200 dark:border-gray-700` : '',
          )}
          style={{ width: 48, minWidth: 48, maxWidth: 48 }}>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={(e) => onRowSelect?.(record, e.target.checked)}
            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </td>
      )}
      {visibleColumns.map((column, colIndex) => {
        return (
          <td
            key={column.key}
            className={cn(
              'relative text-sm text-gray-900 dark:text-white whitespace-nowrap',
              densityClasses[density ?? 'default'],
              column.align === 'center'
                ? 'text-center'
                : column.align === 'right'
                  ? 'text-right'
                  : '',
              bordered
                ? `border-b ${colIndex < visibleColumns.length - 1 || hasActions ? 'border-r' : ''} border-gray-200 dark:border-gray-700`
                : '',
            )}
            style={{
              width: column.width,
              minWidth: column.width ? undefined : '100px',
              maxWidth: '350px',
            }}>
            <div className='flex items-center gap-2 group min-w-0 overflow-hidden max-w-full'>
              {column.render ? (
                column.render(record[column.dataIndex as keyof DataRow<T>], record, rowIndex)
              ) : (
                <TruncateTooltip
                  text={String(record[column.dataIndex as keyof DataRow<T>] ?? '—')}
                  className='text-sm'
                />
              )}
            </div>
          </td>
        );
      })}
      {hasActions && (
        <td className={stickyTdClasses} style={{ width: 128, minWidth: 128, maxWidth: 128 }}>
          <div className='flex items-center justify-center gap-1'>
            {actions?.map((action) => {
              const isHidden =
                typeof action.hidden === 'function' ? action.hidden(record) : action.hidden;
              if (isHidden) return null;
              const isDisabled =
                typeof action.disabled === 'function' ? action.disabled(record) : action.disabled;
              const variants = {
                primary: 'text-blue-600 hover:bg-gray-200',
                secondary: 'text-gray-600 hover:bg-gray-200',
                danger: 'text-red-600 hover:bg-gray-200',
                success: 'text-green-600 hover:bg-gray-200',
              };
              const icon = action.getIcon ? action.getIcon(record) : action.icon;
              return (
                <button
                  key={action.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) action.onClick(record, rowIndex);
                  }}
                  disabled={isDisabled}
                  className={`p-1 rounded transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : variants[action.variant || 'secondary']}`}
                  title={action.label}>
                  {icon}
                </button>
              );
            })}
          </div>
        </td>
      )}
    </tr>
  );
}

const MemoizedTableRow = React.memo(TableRowBase) as <T extends TableOrViewName>(
  props: TableRowProps<T>,
) => React.ReactElement;

function TableBodyBase<T extends TableOrViewName>({
  processedData,
  visibleColumns,
  loading,
  emptyText,
  ...rest
}: TableBodyProps<T>) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)}
            className={rest.bordered ? 'border-b border-gray-200 dark:border-gray-700' : ''}>
            <div className='py-6'>
              <TableSkeleton
                rows={processedData.length || 5}
                columns={
                  visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)
                }
                showHeader={false}
              />
            </div>
          </td>
        </tr>
      </tbody>
    );
  }
  if (processedData.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)}
            className={rest.bordered ? 'border-b border-gray-200 dark:border-gray-700' : ''}>
            <FancyEmptyState
              title='No Data Found'
              description={emptyText || 'Try adjusting your search or filters.'}
            />
          </td>
        </tr>
      </tbody>
    );
  }
  const selectedRowIds = new Set(rest.selectedRows.map((r) => (r as DataRow<T>).id));
  return (
    <tbody
      className={`bg-white dark:bg-gray-800 ${rest.striped && !rest.bordered ? 'divide-y divide-gray-200 dark:divide-gray-700' : ''}`}>
      {processedData.map((record, rowIndex) => (
        <MemoizedTableRow
          key={`${record.id} + ${rowIndex}`}
          record={record}
          rowIndex={rowIndex}
          visibleColumns={visibleColumns}
          isSelected={selectedRowIds.has(record.id)}
          {...rest}
        />
      ))}
    </tbody>
  );
}

export const TableBody = React.memo(TableBodyBase) as <T extends TableOrViewName>(
  props: TableBodyProps<T>,
) => React.ReactElement;
