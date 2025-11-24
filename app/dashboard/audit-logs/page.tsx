// app/dashboard/audit-logs/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
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

export default function AuditLogsPage() {
  const { isSuperAdmin, role } = useUser();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    data: logs,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    viewModal
  } = useCrudManager<'user_activity_logs', V_audit_logsRowSchema>({
    // THE FIX: Use the table name here to satisfy the constraint,
    // even though we are fetching view data via the hook.
    tableName: 'user_activity_logs', 
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

  // Note: passing 'v_audit_logs' as T here works because useStandardHeaderActions uses TableOrViewName
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

      <DataTable
        tableName="v_audit_logs"
        data={logs}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        searchable
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
    </div>
  );
}