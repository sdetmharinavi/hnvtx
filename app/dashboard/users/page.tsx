"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FiUsers } from "react-icons/fi";
import { useAdminGetAllUsersExtended, useIsSuperAdmin, useAdminUserOperations } from "@/hooks/useAdminUsers";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { UserFilters } from "@/components/users/UserFilters";
import { BulkActions } from "@/components/users/BulkActions";
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from "@/hooks/useCrudManager";
import { PageHeader, useStandardHeaderActions } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { createStandardActions } from "@/components/table/action-helpers";
import UserProfileEditModal from "@/components/users/UserProfileEditModal";
import { UserProfileFormData } from "@/schemas";
import { UserProfileData } from "@/components/users/user-types";
import { UserProfileColumns } from "@/config/table-columns/UsersTableColumns";

// This hook adapts the specific RPC hook to the generic interface required by useCrudManager.
// 1. ADAPTER HOOK: Makes `useAdminGetAllUsersExtended` compatible with `useCrudManager`
const useUsersData = (params: DataQueryHookParams): DataQueryHookReturn<UserProfileData> => {
  const { currentPage, pageLimit, searchQuery, filters } = params;

  const { data, isLoading, error, refetch } = useAdminGetAllUsersExtended({
    search_query: searchQuery || undefined,
    filter_role: (filters.role as string) || undefined,
    filter_status: (filters.status as string) || undefined,
    page_offset: (currentPage - 1) * pageLimit,
    page_limit: pageLimit,
  });

  return {
    data: data || [], // `data` is now correctly typed as UserProfileData[]
    totalCount: data?.length || 0,
    isLoading,
    error,
    refetch,
  };
};
const AdminUsersPage = () => {
  // --- STATE MANAGEMENT (Mimicking useCrudManager) ---
  const [showFilters, setShowFilters] = useState(false);
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { bulkDelete, bulkUpdateRole, bulkUpdateStatus, isLoading: isOperationLoading } = useAdminUserOperations();
  const columns = UserProfileColumns();

  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: users,
    totalCount,
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
  } = useCrudManager<"user_profiles", UserProfileData>({
    tableName: "user_profiles",
    dataQueryHook: useUsersData,
  });

  const { selectedRowIds, handleClearSelection } = bulkActions;

  const tableActions = useMemo(
    () =>
      createStandardActions<UserProfileData>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
        canDelete: (record) => !record.is_super_admin,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRowIds.length} selected user(s)?`)) return;

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

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success("Refreshed successfully!");
    },
    // onAddNew: placeholder ToDo,
    isLoading: isLoading,
    exportConfig: { tableName: "user_profiles" },
  });

  const headerStats = [
    { value: totalCount, label: "Total Users" },
    {
      value: users.filter((r) => r.status).length,
      label: "Active",
      color: "success" as const,
    },
    {
      value: users.filter((r) => !r.status).length,
      label: "Inactive",
      color: "danger" as const,
    },
  ];

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: "Retry",
            onClick: refetch,
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <div className='p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6'>
      <PageHeader
        title='User Management'
        description='Manage network users and their related information.'
        icon={<FiUsers />}
        stats={headerStats}
        actions={headerActions} // <-- Pass the generated actions
        isLoading={isLoading}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isSuperAdmin={!!isSuperAdmin}
        isOperationLoading={isMutating}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateRole={handleBulkUpdateRole}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
      />
      <DataTable
        tableName='v_user_profiles_extended'
        data={users as unknown as Row<"v_user_profiles_extended">[]}
        columns={columns}
        loading={isLoading || isOperationLoading}
        actions={tableActions}
        selectable
        onRowSelect={(rows) => {
          // Filter out any rows where id is null
          const validRows = rows.filter((row): row is UserProfileData & { id: string } => row.id !== null);
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
            roleFilter={(filters.filters.role as string) || ""}
            onRoleFilterChange={(value) => filters.setFilters((prev) => ({ ...prev, role: value }))}
            statusFilter={(filters.filters.status as string) || ""}
            onStatusFilterChange={(value) => filters.setFilters((prev) => ({ ...prev, status: value }))}
            emailVerificationFilter={""} // This filter is not implemented in the hook yet
            onEmailVerificationFilterChange={() => {}}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearFilters={() => {
              search.setSearchQuery("");
              filters.setFilters((prev) => ({ ...prev, role: "", status: "" }));
            }}
          />
        }
      />
      <UserProfileEditModal
        isOpen={editModal.isOpen}
        user={editModal.record as UserProfileFormData}
        onClose={editModal.close}
        onSave={() => {
          refetch();
        }}
      />

      <UserDetailsModal isOpen={viewModal.isOpen} user={viewModal.record as UserProfileData} onClose={viewModal.close} />
      <ConfirmModal isOpen={deleteModal.isOpen} onConfirm={deleteModal.confirm} onCancel={deleteModal.cancel} title='Confirm Deletion' message={deleteModal.message} loading={deleteModal.isLoading} type='danger' />
    </div>
  );
};

export default AdminUsersPage;
