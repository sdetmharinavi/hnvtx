'use client';

import { Button } from '@/components/common/ui/Button';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { SortDirection, useSorting } from '@/hooks/useSorting';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';

interface LookupTypesTableProps {
  lookups: Lookup_typesRowSchema[];
  onEdit?: (lookup: Lookup_typesRowSchema) => void;
  onDelete?: (lookup: Lookup_typesRowSchema) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void;
  selectedCategory: string;
  searchTerm: string;
  onSort?: (key: string) => void;
  getSortDirection?: (key: string) => SortDirection;
  canManage: boolean;
}

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  onSort?: (key: string) => void;
  getSortDirection?: (key: string) => SortDirection;
  className?: string;
}

function SortableHeader({
  children,
  sortKey,
  onSort,
  getSortDirection,
  className = '',
}: SortableHeaderProps) {
  const sortDirection = getSortDirection?.(sortKey);
  const isSortable = onSort && getSortDirection;

  const handleClick = () => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  if (!isSortable) {
    return (
      <th
        className={`px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase ${className}`}
      >
        {children}
      </th>
    );
  }

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      title={`Sort by ${String(children).toLowerCase()}`}
    >
      <div className="flex items-center justify-between group">
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          {sortDirection === 'asc' ? (
            <FiChevronUp className="h-3 w-3 text-blue-500" />
          ) : sortDirection === 'desc' ? (
            <FiChevronDown className="h-3 w-3 text-blue-500" />
          ) : (
            <div className="opacity-0 group-hover:opacity-50 transition-opacity">
              <FiChevronUp className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    </th>
  );
}

export function LookupTypesTable({
  lookups,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedCategory,
  searchTerm,
  onSort,
  getSortDirection,
  canManage
}: LookupTypesTableProps) {
  
  // Use local sorting for display if onSort is not provided by parent, 
  // though the parent hook already sorts data. This is a safe fallback.
  const { sortedData: sortedLookups } = useSorting({
    data: lookups,
    defaultSortKey: 'sort_order',
    defaultDirection: 'asc',
  });

  const displayData = onSort ? lookups : sortedLookups;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
             {/* Sort Order is useful to see for admins */}
             <SortableHeader sortKey="sort_order" onSort={onSort} getSortDirection={getSortDirection}>
              Order
            </SortableHeader>
            <SortableHeader
              sortKey="name"
              onSort={onSort}
              getSortDirection={getSortDirection}
            >
              Name
            </SortableHeader>
            <SortableHeader
              sortKey="code"
              onSort={onSort}
              getSortDirection={getSortDirection}
            >
              Short Code
            </SortableHeader>
            <SortableHeader
              sortKey="description"
              onSort={onSort}
              getSortDirection={getSortDirection}
            >
              Description
            </SortableHeader>
            <SortableHeader
              sortKey="status"
              onSort={onSort}
              getSortDirection={getSortDirection}
            >
              Status
            </SortableHeader>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {displayData.map((lookup) => (
            <tr key={lookup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                {lookup.sort_order ?? 0}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[150px] wrap-break-word">
                {lookup.name ?? '-'}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono">
                {lookup.code || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs wrap-break-word">
                {lookup.description || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => onToggleStatus && onToggleStatus(lookup.id!, !!lookup.status)}
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    lookup.status
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                  disabled={!!lookup.is_system_default || !canManage || !onToggleStatus}
                >
                  {lookup.status ? 'Active' : 'Inactive'}
                </Button>
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {onEdit && canManage && (
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!!lookup.is_system_default}
                        onClick={() => onEdit(lookup)}
                        title={lookup.is_system_default ? 'Cannot edit system default' : 'Edit'}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        <FiEdit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(lookup)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        disabled={!!lookup.is_system_default}
                        title={lookup.is_system_default ? 'Cannot delete system default' : 'Delete'}
                    >
                        <FiTrash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {displayData.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `No lookup types found matching "${searchTerm}" in category "${selectedCategory}".`
            : `No lookup types found for category "${selectedCategory}".`}
        </div>
      )}
    </div>
  );
}