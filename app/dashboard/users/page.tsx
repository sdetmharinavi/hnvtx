// app/dashboard/users/page.tsx
'use client';

import { useStandardHeaderActions } from '@/components/common/page-header';
import { BulkActions } from '@/components/users/BulkActions';
import { UserCreateModal } from '@/components/users/UserCreateModal';
import { ErrorDisplay, PageSpinner, RoleBadge, StatusBadge } from '@/components/common/ui';
import { UserProfileColumns } from '@/config/table-columns/UsersTableColumns';
import { UserDetailsModal } from '@/config/user-details-config';
import { Row } from '@/hooks/database';
import { useAdminUserOperations, type UserCreateInput } from '@/hooks/data/useAdminUserMutations';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useCallback, useMemo, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { V_user_profiles_extendedRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { TableAction } from '@/components/table/datatable-types';
import { Json } from '@/types/supabase-types';
import { useUser } from '@/providers/UserProvider';
import { useUsersData } from '@/hooks/data/useUsersData';
import Image from 'next/image';
import { UserRole } from '@/types/user-roles';
import { UnauthorizedModal } from '@/components/auth/UnauthorizedModal';
import UserProfileEditModal from '@/components/users/UserProfileEditModal';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

const AdminUsersPage = () => {
  const { isSuperAdmin, role, isLoading: isUserLoading } = useUser();
  const {
    createUser,
    deleteUsers: bulkDelete,
    updateUserRoles: bulkUpdateRole,
    updateUserStatus: bulkUpdateStatus,
    isLoading: isOperationLoading,
  } = useAdminUserOperations();

  const crud = useCrudManager<'user_profiles', V_user_profiles_extendedRowSchema>({
    tableName: 'user_profiles',
    dataQueryHook: useUsersData,
  });

  const {
    data: users,
    totalCount,
    isLoading,
    isMutating,
    error,
    refetch,
    pagination,
    editModal,
    viewModal,
    bulkActions,
  } = crud;

  const canManage = useMemo(() => isSuperAdmin || role === UserRole.ADMINPRO, [isSuperAdmin, role]);

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'role',
        label: 'Role',
        type: 'native-select',
        options: Object.values(UserRole).map((r) => ({
          value: r,
          label: r.replace(/_/g, ' ').toUpperCase(),
        })),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'native-select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'suspended', label: 'Suspended' },
        ],
      },
      {
        key: 'is_email_verified',
        label: 'Email Status',
        type: 'native-select',
        options: [
          { value: 'true', label: 'Verified' },
          { value: 'false', label: 'Unverified' },
        ],
      },
    ],
    [],
  );

  const columns = UserProfileColumns(users as V_user_profiles_extendedRowSchema[]);
  const { selectedRowIds, handleClearSelection } = bulkActions;

  const tableActions = useMemo(
    () =>
      createStandardActions<V_user_profiles_extendedRowSchema>({
        onEdit: canManage ? editModal.openEdit : undefined,
        onView: viewModal.open,
        // We handle generic delete via crud, but this page uses a custom hook for users
        // so we can still use the crud modal if we wire the delete handler correctly,
        // OR we just use the custom handler here.
        // For simplicity, let's just use the custom hook logic for now.
        // Actually, let's rely on crud delete modal but map the confirm to our custom hook.
        // BUT useCrudManager's handleDelete maps to the generic delete manager.
        // For users, we need the specific API route.
        // So we'll skip passing onDelete here and rely on bulk actions or custom buttons.
        // Wait, standard actions are row-level.
        // Let's implement a custom row delete for consistency.
        onDelete: canManage
          ? (rec) => {
              if (window.confirm(`Are you sure you want to delete ${rec.full_name}?`)) {
                bulkDelete.mutateAsync({ user_ids: [rec.id!] }).then(() => refetch());
              }
            }
          : undefined,
        canDelete: (record) => canManage && !record.is_super_admin,
      }) as TableAction<'v_user_profiles_extended'>[],
    [editModal.openEdit, viewModal.open, canManage, bulkDelete, refetch],
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
      !window.confirm(`Are you sure you want to delete ${selectedRowIds.length} selected user(s)?`)
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
    [selectedRowIds, bulkUpdateRole, handleClearSelection],
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
    [selectedRowIds, bulkUpdateStatus, handleClearSelection],
  );

  const headerActions = useStandardHeaderActions<'user_profiles'>({
    data: users as Row<'user_profiles'>[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canManage ? () => setIsCreateModalOpen(true) : undefined,
    isLoading: isLoading,
    exportConfig: { tableName: 'user_profiles' },
  });

  const renderMobileItem = useCallback(
    (record: Row<'v_user_profiles_extended'>, actions: React.ReactNode) => {
      return (
        <div className='flex flex-col gap-3'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-3'>
              {record.avatar_url ? (
                <Image
                  src={record.avatar_url}
                  alt='avatar'
                  width={40}
                  height={40}
                  className='rounded-full'
                />
              ) : (
                <div className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold'>
                  {record.first_name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2'>
                  {record.full_name}
                  {record.is_super_admin && (
                    <span className='text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded border border-yellow-200'>
                      SUPER
                    </span>
                  )}
                </h3>
                <div className='text-xs text-gray-500 dark:text-gray-400'>{record.email}</div>
              </div>
            </div>
            {actions}
          </div>

          <div className='flex flex-wrap gap-2 items-center'>
            <RoleBadge role={record.role as UserRole} />
            {record.designation && (
              <span className='text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700'>
                {record.designation}
              </span>
            )}
          </div>

          <div className='flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700'>
            <div className='text-xs text-gray-400'>
              Active: {record.last_activity_period || 'Never'}
            </div>
            <StatusBadge status={record.status ?? 'inactive'} />
          </div>
        </div>
      );
    },
    [],
  );

  if (isUserLoading) {
    return <PageSpinner text='Verifying permissions...' />;
  }

  const allowedRoles = [UserRole.ADMINPRO];
  if (!isSuperAdmin && !allowedRoles.includes(role as UserRole)) {
    return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={role} />;
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
      crud={crud}
      header={{
        title: 'User Management',
        description: 'Manage network users and their related information.',
        icon: <FiUsers />,
        stats: [
          { value: totalCount, label: 'Total Users' },
          {
            value: users.filter((r) => r.status === 'active').length,
            label: 'Active',
            color: 'success',
          },
          {
            value: users.filter((r) => r.status !== 'active').length,
            label: 'Inactive/Suspended',
            color: 'danger',
          },
        ],
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchPlaceholder='Search users by name or email...'
      filterConfigs={filterConfigs}
      // Override standard bulk actions with custom component
      renderBulkActions={() =>
        canManage && selectedRowIds.length > 0 ? (
          <BulkActions
            selectedCount={selectedRowIds.length}
            isSuperAdmin={!!isSuperAdmin}
            isOperationLoading={isMutating || isOperationLoading}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateRole={handleBulkUpdateRole}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onClearSelection={handleClearSelection}
          />
        ) : null
      }
      renderGrid={() => <div className='text-center p-8'>Grid View Not Supported</div>}
      tableProps={{
        tableName: 'v_user_profiles_extended',
        data: users.map((user) => ({
          ...user,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          id: user.id || '',
          address: user.address as Json | null,
        })),
        columns: columns,
        loading: isLoading || isOperationLoading,
        actions: tableActions,
        selectable: true,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_user_profiles_extendedRowSchema & { id: string } => row.id !== null,
          );
          bulkActions.handleRowSelect(validRows);
        },
        searchable: false,
        filterable: false,
        renderMobileItem: renderMobileItem,
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={users.length === 0 && !isLoading}
      // Turn off auto-modal because we handle deletes via custom hook in tableActions
      autoDeleteModal={false}
      modals={
        <>
          <UserProfileEditModal
            isOpen={editModal.isOpen}
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

          {canManage && (
            <UserCreateModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onCreate={handleCreateUser}
              isLoading={createUser.isPending}
            />
          )}
        </>
      }
    />
  );
};

export default AdminUsersPage;
