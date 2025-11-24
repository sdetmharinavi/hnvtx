// app/dashboard/audit-logs/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useAuditLogsData } from '@/hooks/data/useAuditLogsData';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { FiShield, FiEye } from 'react-icons/fi';
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
    // THE FIX: Identify IDs as numbers for correct local DB operations
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
    exportConfig: { tableName: 'v_audit_logs' }
  });

  // Security check
  if (!isSuperAdmin) {
     return <UnauthorizedModal allowedRoles={[UserRole.ADMIN]} currentRole={role} />;
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