// app/dashboard/users/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { BulkActions } from '@/components/users/BulkActions';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { DataTable } from '@/components/table/DataTable';
import { UserFilters } from '@/components/users/UserFilters';
import UserProfileEditModal from '@/components/users/UserProfileEditModal';
import { UserProfileColumns } from '@/config/table-columns/UsersTableColumns';
import { UserDetailsModal } from '@/config/user-details-config';
import { Row } from '@/hooks/database';
import { useAdminUserOperations } from '@/hooks/data/useAdminUserMutations';
import type { UserCreateInput } from '@/hooks/data/useAdminUserMutations';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useCallback, useMemo, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { toast } from 'sonner';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { TableAction } from '@/components/table/datatable-types';
import { Json } from '@/types/supabase-types';
import { useUser } from '@/providers/UserProvider';
import { useUsersData } from '@/hooks/data/useUsersData';

const AdminUsersPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { isSuperAdmin } = useUser();
  const {
    createUser,
    deleteUsers: bulkDelete,
    updateUserRoles: bulkUpdateRole,
    updateUserStatus: bulkUpdateStatus,
    isLoading: isOperationLoading,
  } = useAdminUserOperations();

  const {
    data: users,
    totalCount,
    // activeCount,
    // inactiveCount,
    isLoading,
    isMutating,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    viewModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'user_profiles', V_user_profiles_extendedRowSchema>({
    tableName: 'user_profiles',
    dataQueryHook: useUsersData,
  });

  const columns = UserProfileColumns(users as V_user_profiles_extendedRowSchema[]);
  const { selectedRowIds, handleClearSelection } = bulkActions;

  const tableActions = useMemo(
    () =>
      createStandardActions<V_user_profiles_extendedRowSchema>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
        canDelete: (record) => !record.is_super_admin,
      }) as TableAction<"v_user_profiles_extended">[],
    [editModal.openEdit, viewModal.open, crudActions.handleDelete]
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateUser = async (userData: UserCreateInput) => {
    await createUser.mutateAsync({
      ...userData,
    });
  };

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRowIds.length} selected user(s)?`
      )
    )
      return;

    await bulkDelete.mutateAsync({ user_ids: selectedRowIds });
    handleClearSelection();
  }, [selectedRowIds, bulkDelete, handleClearSelection]);

  const handleBulkUpdateRole = useCallback(
    async (newRole: string) => {
      if (selectedRowIds.length === 0) return;
      await bulkUpdateRole.mutateAsync({
        user_ids: selectedRowIds,
        new_role: newRole,
      });
      handleClearSelection();
    },
    [selectedRowIds, bulkUpdateRole, handleClearSelection]
  );

  const handleBulkUpdateStatus = useCallback(
    async (newStatus: string) => {
      if (selectedRowIds.length === 0) return;
      await bulkUpdateStatus.mutateAsync({
        user_ids: selectedRowIds,
        new_status: newStatus,
      });
      handleClearSelection();
    },
    [selectedRowIds, bulkUpdateStatus, handleClearSelection]
  );

  const headerActions = useStandardHeaderActions<'user_profiles'>({
    data: users as Row<'user_profiles'>[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: () => setIsCreateModalOpen(true),
    isLoading: isLoading,
    exportConfig: { tableName: 'user_profiles' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Users' },
    {
      value: users.filter((r) => r.status).length,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: users.filter((r) => !r.status).length,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetch,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <PageHeader
        title="User Management"
        description="Manage network users and their related information."
        icon={<FiUsers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isSuperAdmin={!!isSuperAdmin}
        isOperationLoading={isMutating}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateRole={handleBulkUpdateRole}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={handleClearSelection}
      />
      <DataTable
        tableName="v_user_profiles_extended"
        data={users.map(user => ({
          ...user,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          id: user.id || '',
          address: user.address as Json | null
        }))}
        columns={columns}
        loading={isLoading || isOperationLoading}
        actions={tableActions}
        selectable
        onRowSelect={(rows) => {
          const validRows = rows.filter(
            (row): row is V_user_profiles_extendedRowSchema & { id: string } => row.id !== null
          );
          bulkActions.handleRowSelect(validRows);
        }}
        searchable={false}
        filterable={false}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
        customToolbar={
          <UserFilters
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            roleFilter={(filters.filters.role as string) || ''}
            onRoleFilterChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, role: value }))
            }
            statusFilter={(filters.filters.status as string) || ''}
            onStatusFilterChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, status: value }))
            }
            emailVerificationFilter={''}
            onEmailVerificationFilterChange={() => {}}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearFilters={() => {
              search.setSearchQuery('');
              filters.setFilters((prev) => ({ ...prev, role: '', status: '' }));
            }}
          />
        }
      />
      <UserProfileEditModal
        isOpen={editModal.isOpen}
        // THE FIX: The incorrect cast is no longer needed. The types now match.
        user={editModal.record as V_user_profiles_extendedRowSchema | null}
        onClose={editModal.close}
        onSave={() => {
          refetch();
        }}
      />

      <UserDetailsModal
        isOpen={viewModal.isOpen}
        user={viewModal.record as V_user_profiles_extendedRowSchema}
        onClose={viewModal.close}
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

      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
        isLoading={createUser.isPending}
      />
    </div>
  );
};

export default AdminUsersPage;