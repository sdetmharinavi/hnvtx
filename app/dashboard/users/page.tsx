"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FiUsers } from "react-icons/fi";
import { useAdminGetAllUsersExtended, useIsSuperAdmin, useAdminUserOperations } from "@/hooks/useAdminUsers";
import { getUserTableColumns } from "@/components/users/UserTableColumns";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import UserProfileEdit from "@/components/users/UserProfileEditModal";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { UserFilters } from "@/components/users/UserFilters";
import { BulkActions } from "@/components/users/BulkActions";
import { DataQueryHookParams, useCrudManager } from "@/hooks/useCrudManager";
import { PageHeader, useStandardHeaderActions } from "@/components/common/PageHeader";
import { toast } from "sonner";
import { createStandardActions } from "@/components/table/action-helpers";
import UserProfileEditModal from "@/components/users/UserProfileEditModal";
import { UserProfile, UserProfileFormData } from "@/schemas";

// 1. ADAPTER HOOK
// This hook adapts the specific RPC hook to the generic interface required by useCrudManager.
const useUsersData = (params: DataQueryHookParams) => {
  const { currentPage, pageLimit, searchQuery, filters } = params;
  const { data, isLoading, error, refetch } = useAdminGetAllUsersExtended({
    search_query: searchQuery || undefined,
    filter_role: (filters.role as string) || undefined,
    filter_status: (filters.status as string) || undefined,
    page_offset: (currentPage - 1) * pageLimit,
    page_limit: pageLimit,
  });

  return {
    data: data || [],
    totalCount: data?.[0]?.total_count || 0,
    isLoading,
    error,
    refetch,
  };
};

const AdminUsersPage = () => {
  // --- STATE MANAGEMENT (Mimicking useCrudManager) ---
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { bulkDelete, bulkUpdateRole, bulkUpdateStatus, isLoading: isOperationLoading } = useAdminUserOperations();

  // 2. USE THE CRUD MANAGER with the adapter hook
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
    bulkActions,
    deleteModal,
    modal,
    actions,
    // ... we don't need modal/actions from the manager for this specific page
  } = useCrudManager<"user_profiles">({
    tableName: "user_profiles", // Still needed for mutations if we were using them
    dataQueryHook: useUsersData, // <-- Dependency Injection!
  });

  const { selectedRowIds, selectedCount, handleClearSelection } = bulkActions;

  // --- MUTATIONS ---
  const deleteManager = useDeleteManager({
    tableName: "user_profiles", // For single deletes via RPC
    onSuccess: refetch,
  });
  // --- HANDLERS ---
  const handleEditUser = useCallback((userId: string) => setEditingUserId(userId), []);
  const handleViewUser = useCallback((userId: string) => setViewingUserId(userId), []);

  const handleDeleteUser = useCallback(
    (userId: string, name: string) => {
      deleteManager.deleteSingle({ id: userId, name: name || `user ${userId}` });
    },
    [deleteManager]
  );

  // --- MEMOIZED VALUES ---
  const columns = useMemo(() => getUserTableColumns(), []);
  // const tableActions = useMemo(
  //   () =>
  //     getUserTableActions({
  //       isSuperAdmin: !!isSuperAdmin,
  //       onEdit: handleEditUser,
  //       onView: handleViewUser,
  //       onDelete: (userId) => handleDeleteUser(userId, users?.find((u) => u.id === userId)?.first_name || `user ${userId}`),
  //     }),
  //   [isSuperAdmin, handleEditUser, handleViewUser, handleDeleteUser, users]
  // );
  const tableActions = useMemo(() => createStandardActions<'user_profiles'>({
      onEdit: modal.openEditModal,
      // onToggleStatus: (record) => {
      //   // Convert string status to boolean for the toggle action
      //   const currentStatus = record.status === 'active';
      //   actions.handleToggleStatus({ ...record, status: currentStatus });
      // },
      onView: modal.openViewModal,
      onDelete: actions.handleDelete,
      // You can also add custom logic, for example:
      // canDelete: (record) => record.name !== 'CRITICAL_RING', 
    }), [handleEditUser, actions.handleToggleStatus, actions.handleDelete, handleViewUser]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRowIds.length} selected user(s)?`)) return;

    await bulkDelete.mutateAsync({ user_ids: selectedRowIds });
    handleClearSelection();
  }, [selectedRowIds, bulkDelete, handleClearSelection]);

  const handleBulkUpdateRole = useCallback(
    async (newRole: string) => {
      if (selectedRowIds.length === 0) return;
      await bulkUpdateRole.mutateAsync({ user_ids: selectedRowIds, new_role: newRole });
      handleClearSelection();
    },
    [selectedRowIds, bulkUpdateRole, handleClearSelection]
  );

  const handleBulkUpdateStatus = useCallback(
    async (newStatus: string) => {
      if (selectedRowIds.length === 0) return;
      await bulkUpdateStatus.mutateAsync({ user_ids: selectedRowIds, new_status: newStatus });
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
    { value: users.filter((r) => r.status).length, label: "Active", color: "success" as const },
    { value: users.filter((r) => !r.status).length, label: "Inactive", color: "danger" as const },
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
        // onRowSelect={(rows) => setSelectedUserIds(rows.map(r => r.id).filter((id): id is string => !!id))}
        onRowSelect={(rows) => bulkActions.handleRowSelect(rows as Row<"user_profiles">[])}
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
          isOpen={modal.isModalOpen}
          user={modal.isModalOpen ? (modal.editingRecord as UserProfileFormData) : null}
          onClose={modal.closeModal}
          onSave={() => {
            refetch();
          }}
        />


        <UserDetailsModal
          isOpen={modal.isViewModalOpen}
          user={modal.isViewModalOpen ? (modal.viewingRecord as UserProfile) : null}
          onClose={modal.closeViewModal}
        />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title='Confirm Deletion'
        message={deleteModal.message}
        loading={deleteModal.isLoading}
        type='danger'
      />
    </div>
  );
};

export default AdminUsersPage;
