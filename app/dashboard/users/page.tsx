"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FiUsers, FiDownload } from "react-icons/fi";
import { useDebounce } from "use-debounce";
import { useAdminGetAllUsersExtended, useIsSuperAdmin, useAdminUserOperations } from "@/hooks/useAdminUsers";
import { useUserExport } from "@/components/users/useUserExport";
import { getUserTableColumns } from "@/components/users/UserTableColumns";
import { getUserTableActions } from "@/components/users/UserTableActions";
import { UserFilters } from "@/components/users/UserFilters";
import { BulkActions } from "@/components/users/BulkActions";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import UserProfileEdit from "@/components/users/UserProfileEdit";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import { Button, ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { useDeleteManager } from "@/hooks/useDeleteManager";

const AdminUsersPage = () => {
  // --- STATE MANAGEMENT (Mimicking useCrudPage) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // --- DATA FETCHING (Specialized Hook) ---
  const { data: usersData, isLoading, isError, error, refetch } = useAdminGetAllUsersExtended({
    search_query: debouncedSearchQuery || undefined,
    filter_role: roleFilter || undefined,
    filter_status: statusFilter || undefined,
    page_offset: (currentPage - 1) * pageLimit,
    page_limit: pageLimit,
  });
  
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { handleExport } = useUserExport();

  const users = usersData || [];
  const totalCount = users[0]?.total_count || 0;

  // --- MUTATIONS ---
  const { bulkDelete, bulkUpdateRole, bulkUpdateStatus, isLoading: isOperationLoading } = useAdminUserOperations();
  const deleteManager = useDeleteManager({
    tableName: 'user_profiles', // For single deletes via RPC
    onSuccess: refetch,
  });

  // --- HANDLERS ---
  const handleEditUser = useCallback((userId: string) => setEditingUserId(userId), []);
  const handleViewUser = useCallback((userId: string) => setViewingUserId(userId), []);
  
  const handleDeleteUser = useCallback((userId: string, name: string) => {
    deleteManager.deleteSingle({ id: userId, name: name || `user ${userId}` });
  }, [deleteManager]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} selected user(s)?`)) return;
    
    await bulkDelete.mutateAsync({ user_ids: selectedUserIds });
    setSelectedUserIds([]);
  }, [selectedUserIds, bulkDelete]);

  const handleBulkUpdateRole = useCallback(async (newRole: string) => {
    if (selectedUserIds.length === 0) return;
    await bulkUpdateRole.mutateAsync({ user_ids: selectedUserIds, new_role: newRole });
    setSelectedUserIds([]);
  }, [selectedUserIds, bulkUpdateRole]);

  const handleBulkUpdateStatus = useCallback(async (newStatus: string) => {
    if (selectedUserIds.length === 0) return;
    await bulkUpdateStatus.mutateAsync({ user_ids: selectedUserIds, new_status: newStatus });
    setSelectedUserIds([]);
  }, [selectedUserIds, bulkUpdateStatus]);

  // --- MEMOIZED VALUES ---
  const columns = useMemo(() => getUserTableColumns(), []);
  const tableActions = useMemo(() => getUserTableActions({
    isSuperAdmin: !!isSuperAdmin,
    onEdit: handleEditUser,
    onView: handleViewUser,
    onDelete: (userId) => handleDeleteUser(userId, usersData?.find((u) => u.id === userId)?.first_name || `user ${userId}`),
  }), [isSuperAdmin, handleEditUser, handleViewUser, handleDeleteUser, usersData]);

  if (isError) {
    return <ErrorDisplay error={error.message} actions={[
      {
        label: "Retry",
        onClick: refetch,
        variant: "primary",
      },
    ]} />;
  }

  return (
    <div className='p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6'>
      <div className='flex items-center gap-3'>
        <FiUsers className='text-xl sm:text-2xl text-blue-600 dark:text-blue-400' />
        <h1 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-white'>
          User Management ({totalCount})
        </h1>
        <div className="ml-auto">
          <Button
            onClick={() => handleExport(searchQuery, roleFilter, statusFilter)}
            leftIcon={<FiDownload />}
            variant="outline"
          >
            Export
          </Button>
        </div>
      </div>

      <BulkActions
        selectedCount={selectedUserIds.length}
        isSuperAdmin={!!isSuperAdmin}
        isOperationLoading={isOperationLoading}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateRole={handleBulkUpdateRole}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={() => setSelectedUserIds([])}
      />

      <DataTable
        tableName='v_user_profiles_extended'
        data={users as unknown as Row<'v_user_profiles_extended'>[]}
        columns={columns}
        loading={isLoading || isOperationLoading}
        actions={tableActions}
        selectable
        onRowSelect={(rows) => setSelectedUserIds(rows.map(r => r.id).filter((id): id is string => !!id))}
        searchable={false}
        filterable={false}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
            setPageLimit(pageSize);
          },
        }}
        customToolbar={
          <UserFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            emailVerificationFilter={""} // This filter is not implemented in the hook yet
            onEmailVerificationFilterChange={() => {}}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearFilters={() => {
              setSearchQuery("");
              setRoleFilter("");
              setStatusFilter("");
            }}
          />
        }
      />

      {editingUserId && (
        <UserProfileEdit
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onSave={() => {
            refetch();
            setEditingUserId(null);
          }}
        />
      )}
      
      {viewingUserId && (
        <UserDetailsModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onEdit={() => {
            setEditingUserId(viewingUserId);
            setViewingUserId(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        loading={deleteManager.isPending}
        type="danger"
      />
    </div>
  );
};

export default AdminUsersPage;