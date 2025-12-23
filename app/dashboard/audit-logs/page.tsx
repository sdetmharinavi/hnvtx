// app/dashboard/audit-logs/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useAuditLogsData } from '@/hooks/data/useAuditLogsData';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { FiShield, FiEye, FiClock } from 'react-icons/fi';
import { toast } from 'sonner';
import { AuditLogsTableColumns } from '@/config/table-columns/AuditLogsTableColumns';
import { AuditLogDetailsModal } from '@/components/audit/AuditLogDetailsModal';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useUser } from '@/providers/UserProvider';
import { UnauthorizedModal } from '@/components/auth/UnauthorizedModal';
import { UserRole } from '@/types/user-roles';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { BulkActions } from '@/components/common/BulkActions';
import { Row } from '@/hooks/database';
import { formatDate } from '@/utils/formatters';

export default function AuditLogsPage() {
  const { isSuperAdmin, role } = useUser();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    data: logs,
    totalCount,
    isLoading,
    isFetching,
    isMutating,
    error,
    refetch,
    pagination,
    search,
    filters,
    viewModal,
    bulkActions,
    deleteModal,
  } = useCrudManager<'user_activity_logs', V_audit_logsRowSchema>({
    tableName: 'user_activity_logs', 
    localTableName: 'v_audit_logs',
    idType: 'number',
    dataQueryHook: useAuditLogsData,
    displayNameField: 'action_type',
  });

  const columns = AuditLogsTableColumns(logs);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_audit_logs]);

  const tableActions = useMemo((): TableAction<'v_audit_logs'>[] => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FiEye />,
      onClick: viewModal.open,
      variant: 'secondary'
    }
  ], [viewModal.open]);

  const headerActions = useStandardHeaderActions<'v_audit_logs'>({
    data: logs,
    onRefresh: async () => { await refetch(); toast.success('Logs refreshed!'); },
    isLoading: isLoading,
    // THE FIX: Use RPC
    exportConfig: !!isSuperAdmin ? { tableName: 'v_audit_logs', useRpc: true } : undefined
  });

  const renderMobileItem = useCallback((record: Row<'v_audit_logs'>, actions: React.ReactNode) => {
    
    // Action Badge Logic
    const getActionColor = (action: string) => {
        switch(action) {
            case 'INSERT': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionColor(record.action_type || '')}`}>
                {record.action_type}
             </span>
             <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {record.table_name}
             </span>
          </div>
          {actions}
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700 font-mono break-all line-clamp-2">
           ID: {record.record_id}
        </div>

        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
             <div className="flex items-center gap-1.5">
                 <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold">
                    {record.performed_by_name?.charAt(0) || '?'}
                 </div>
                 <span className="truncate max-w-[100px]">{record.performed_by_name || 'System'}</span>
             </div>
             <div className="flex items-center gap-1">
                 <FiClock className="w-3 h-3" />
                 {record.created_at ? formatDate(record.created_at, { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
             </div>
        </div>
      </div>
    );
  }, []);

  // Security check
  const allowedAuditRoles = [UserRole.ADMIN, UserRole.ADMINPRO];
  if (!isSuperAdmin && !allowedAuditRoles.includes(role as UserRole)) {
    return <UnauthorizedModal allowedRoles={allowedAuditRoles} currentRole={role} />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System Audit Logs"
        description="Track all user activities and data changes across the platform."
        icon={<FiShield />}
        stats={[{ label: 'Total Logs', value: totalCount }]}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      <BulkActions
        selectedCount={bulkActions.selectedCount}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={() => {}} // Not applicable for audit logs
        onClearSelection={bulkActions.handleClearSelection}
        showStatusUpdate={false}
        entityName="audit log"
        isOperationLoading={isMutating}
      />

           <DataTable
      autoHideEmptyColumns={true}
        tableName="v_audit_logs"
        data={logs}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        searchable
        selectable={true}
        onRowSelect={(selectedRows) => {
          const validRows = selectedRows.filter(
            (row): row is V_audit_logsRowSchema & { id: number } => row.id !== null
          );
          bulkActions.handleRowSelect(validRows);
        }}
        renderMobileItem={renderMobileItem}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
             pagination.setCurrentPage(page);
             pagination.setPageLimit(limit);
          }
        }}
        customToolbar={
            <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
                hasActiveFilters={Object.keys(filters.filters).length > 0 || !!search.searchQuery}
                activeFilterCount={Object.keys(filters.filters).length}
            >
                <SelectFilter
                    label="Action Type"
                    filterKey="action_type"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[
                        { value: 'INSERT', label: 'Create (Insert)' },
                        { value: 'UPDATE', label: 'Edit (Update)' },
                        { value: 'DELETE', label: 'Delete' },
                    ]}
                />
            </SearchAndFilters>
        }
      />

      <AuditLogDetailsModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        log={viewModal.record as V_audit_logsRowSchema | null}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}