// app/dashboard/audit-logs/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { TableAction } from '@/components/table/datatable-types';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useAuditLogsData } from '@/hooks/data/useAuditLogsData';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { FiShield, FiEye, FiClock, FiDatabase } from 'react-icons/fi';
import { toast } from 'sonner';
import { AuditLogsTableColumns } from '@/config/table-columns/AuditLogsTableColumns';
import { AuditLogDetailsModal } from '@/components/audit/AuditLogDetailsModal';
import { useUser } from '@/providers/UserProvider';
import { UnauthorizedModal } from '@/components/auth/UnauthorizedModal';
import { UserRole } from '@/types/user-roles';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { Row } from '@/hooks/database';
import { formatDate } from '@/utils/formatters';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added

export default function AuditLogsPage() {
  const { isSuperAdmin, role } = useUser();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const crud = useCrudManager<'user_activity_logs', V_audit_logsRowSchema>({
    tableName: 'user_activity_logs',
    localTableName: 'v_audit_logs',
    idType: 'number',
    dataQueryHook: useAuditLogsData,
    displayNameField: 'action_type',
    syncTables: ['user_activity_logs', 'v_audit_logs'],
  });

  const {
    data: logs,
    totalCount,
    isLoading,
    isFetching,
    isMutating,
    error,
    refetch,
    pagination,
    viewModal,
    bulkActions,
    filters, // Need filters for stats logic
  } = crud;

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'action_type',
        label: 'Action Type',
        type: 'native-select',
        options: [
          { value: 'INSERT', label: 'Create (Insert)' },
          { value: 'UPDATE', label: 'Edit (Update)' },
          { value: 'DELETE', label: 'Delete' },
        ],
      },
    ],
    [],
  );

  const columns = AuditLogsTableColumns(logs);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_audit_logs]);

  const tableActions = useMemo(
    (): TableAction<'v_audit_logs'>[] => [
      {
        key: 'view',
        label: 'View Details',
        icon: <FiEye />,
        onClick: viewModal.open,
        variant: 'secondary',
      },
    ],
    [viewModal.open],
  );

  const headerActions = useStandardHeaderActions<'v_audit_logs'>({
    data: logs,
    onRefresh: async () => {
      await refetch();
      toast.success('Logs refreshed!');
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: !!isSuperAdmin ? { tableName: 'v_audit_logs', useRpc: true } : undefined,
  });

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    // Calculate counts based on current data slice (or could be fetched separately)
    // For local-first with large data, doing a full count is expensive without a specific hook.
    // However, we can show filtered counts based on current list if paginated,
    // OR just simple interactive buttons to switch views.

    // Since useAuditLogsData returns data matching the filter, we can't count "all insert" if filter is "delete".
    // We will use buttons to switch filters.

    const currentAction = filters.filters.action_type;

    return [
      {
        value: totalCount,
        label: 'Total Logs',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.action_type;
            return next;
          }),
        isActive: !currentAction,
      },
      {
        value: null, // Don't show number if unknown
        label: 'Inserts',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, action_type: 'INSERT' })),
        isActive: currentAction === 'INSERT',
      },
      {
        value: null,
        label: 'Updates',
        color: 'primary', // Changed to blue/primary
        onClick: () => filters.setFilters((prev) => ({ ...prev, action_type: 'UPDATE' })),
        isActive: currentAction === 'UPDATE',
      },
      {
        value: null,
        label: 'Deletes',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, action_type: 'DELETE' })),
        isActive: currentAction === 'DELETE',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, filters.filters.action_type, filters.setFilters]);

  const renderMobileItem = useCallback((record: Row<'v_audit_logs'>, actions: React.ReactNode) => {
    const getActionColor = (action: string) => {
      switch (action) {
        case 'INSERT':
          return 'bg-green-100 text-green-700 border-green-200';
        case 'UPDATE':
          return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'DELETE':
          return 'bg-red-100 text-red-700 border-red-200';
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    };

    return (
      <div className='flex flex-col gap-2'>
        <div className='flex justify-between items-start'>
          <div className='flex items-center gap-2'>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionColor(record.action_type || '')}`}
            >
              {record.action_type}
            </span>
            <span className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
              {record.table_name}
            </span>
          </div>
          {actions}
        </div>
        <div className='text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700 font-mono break-all line-clamp-2'>
          ID: {record.record_id}
        </div>
        <div className='flex items-center justify-between mt-1 text-xs text-gray-500'>
          <div className='flex items-center gap-1.5'>
            <div className='w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold'>
              {record.performed_by_name?.charAt(0) || '?'}
            </div>
            <span className='truncate max-w-[100px]'>{record.performed_by_name || 'System'}</span>
          </div>
          <div className='flex items-center gap-1'>
            <FiClock className='w-3 h-3' />
            {record.created_at
              ? formatDate(record.created_at, {
                  format: 'dd-mm-yyyy',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}
          </div>
        </div>
      </div>
    );
  }, []);

  const allowedAuditRoles = [UserRole.ADMIN, UserRole.ADMINPRO];
  if (!isSuperAdmin && !allowedAuditRoles.includes(role as UserRole)) {
    return <UnauthorizedModal allowedRoles={allowedAuditRoles} currentRole={role} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );
  }

  return (
    <DashboardPageLayout
      crud={crud} // Pass CRUD manager to auto-wire logic
      header={{
        title: 'System Audit Logs',
        description: 'Track all user activities and data changes across the platform.',
        icon: <FiShield />,
        stats: headerStats, // Interactive Stats
        actions: headerActions,
        isLoading: isLoading,
        isFetching: isFetching,
      }}
      searchPlaceholder='Search logs...'
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: () => {}, // Not supported
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'audit log',
        showStatusUpdate: false,
        canDelete: () => !!isSuperAdmin,
      }}
      renderGrid={() => (
        <div className='text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700'>
          Grid view not available for logs. Please switch to Table view.
        </div>
      )}
      tableProps={{
        tableName: 'v_audit_logs',
        data: logs,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: tableActions,
        searchable: false,
        selectable: true,
        onRowSelect: (selectedRows) => {
          const validRows = selectedRows.filter(
            (row) => row.id !== null,
          ) as (V_audit_logsRowSchema & { id: number })[];
          bulkActions.handleRowSelect(validRows);
        },
        renderMobileItem: renderMobileItem,
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(limit);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={logs.length === 0 && !isLoading}
      emptyState={
        <div className='col-span-full py-16 text-center text-gray-500'>
          <FiDatabase className='w-12 h-12 mx-auto mb-3 text-gray-300' />
          <p>No audit logs found.</p>
        </div>
      }
      modals={
        <>
          <AuditLogDetailsModal
            isOpen={viewModal.isOpen}
            onClose={viewModal.close}
            log={viewModal.record as V_audit_logsRowSchema | null}
          />
        </>
      }
    />
  );
}
