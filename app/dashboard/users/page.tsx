"use client";

import React, { useState, useMemo } from "react";
import { FiUsers, FiDownload } from "react-icons/fi";
import { useDebounce } from "use-debounce";

// Components
import { DataTable } from "@/components/table/DataTable";
import UserProfileEdit from "@/components/users/UserProfileEdit";
import UserDetailsModal from "@/components/users/UserDetailsModal";

// Hooks
import { useAdminGetAllUsersExtended, useIsSuperAdmin, useAdminUserOperations } from "@/hooks/useAdminUsers";

// Types
import { Row } from "@/hooks/database";
import { useUserExport } from "@/components/users/useUserExport";
import { getUserTableColumns } from "@/components/users/UserTableColumns";
import { getUserTableActions } from "@/components/users/UserTableActions";
import { UserFilters } from "@/components/users/UserFilters";
import { BulkActions } from "@/components/users/BulkActions";

const AdminUsersPage = () => {
  // State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [emailVerificationFilter, setEmailVerificationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const pageOffset = (currentPage - 1) * pageLimit;

  // Data fetching
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { bulkDelete, bulkUpdateRole, bulkUpdateStatus, isLoading: isOperationLoading } = useAdminUserOperations();
  const { handleExport } = useUserExport();

  const { data, isLoading, isError, error } = useAdminGetAllUsersExtended({
    search_query: debouncedSearchQuery || undefined,
    filter_role: roleFilter || undefined,
    filter_status: statusFilter || undefined,
    page_offset: pageOffset,
    page_limit: pageLimit,
  });

  const users = data || [];
  const totalCount = users[0]?.total_count || 0;

  // Handlers
  const handleBulkDelete = async () => {
    if (!selectedUsers.length) return;
    if (!window.confirm(`Delete ${selectedUsers.length} user(s)?`)) return;

    try {
      await bulkDelete.mutateAsync({ user_ids: selectedUsers });
      setSelectedUsers([]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleBulkUpdateRole = async (newRole: string) => {
    if (!selectedUsers.length) return;
    try {
      await bulkUpdateRole.mutateAsync({
        user_ids: selectedUsers,
        new_role: newRole,
      });
      setSelectedUsers([]);
    } catch (error) {
      console.error("Bulk role update failed:", error);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (!selectedUsers.length) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        user_ids: selectedUsers,
        new_status: newStatus,
      });
      setSelectedUsers([]);
    } catch (error) {
      console.error("Bulk status update failed:", error);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setEmailVerificationFilter("");
    setCurrentPage(1);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await bulkDelete.mutateAsync({ user_ids: [userId] });
    }
  };

  // Memoized values
  const columns = useMemo(() => getUserTableColumns(), []);
  const actions = useMemo(() => getUserTableActions({
    isSuperAdmin: !!isSuperAdmin,
    onEdit: setEditingUser,
    onView: setViewingUser,
    onDelete: handleDeleteUser,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isSuperAdmin]);

  const customToolbar = (
    <UserFilters
      searchQuery={searchQuery}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      emailVerificationFilter={emailVerificationFilter}
      showFilters={showFilters}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setCurrentPage(1);
      }}
      onRoleFilterChange={(value) => {
        setRoleFilter(value);
        setCurrentPage(1);
      }}
      onStatusFilterChange={(value) => {
        setStatusFilter(value);
        setCurrentPage(1);
      }}
      onEmailVerificationFilterChange={(value) => {
        setEmailVerificationFilter(value);
        setCurrentPage(1);
      }}
      onToggleFilters={() => setShowFilters(!showFilters)}
      onClearFilters={clearFilters}
    />
  );

  if (isError) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center max-w-md w-full'>
          <div className='text-red-600 dark:text-red-400 text-3xl mb-2'>⚠️</div>
          <p className='font-semibold text-gray-800 dark:text-white mb-2'>Failed to load users</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{error?.message || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6'>
      {/* Mobile-optimized header */}
      <div className='space-y-4'>
        {/* Title and icon - always visible */}
        <div className='flex items-center gap-3'>
          <FiUsers className='text-xl sm:text-2xl text-blue-600 dark:text-blue-400 flex-shrink-0' />
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate'>
            User Management
          </h1>
        </div>
        
        {/* Stats and actions row */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          {/* Total count */}
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1'>
            Total Users: <span className='font-bold text-gray-800 dark:text-white'>{totalCount}</span>
          </div>
          
          {/* Actions */}
          <div className='flex flex-col xs:flex-row gap-2 order-1 sm:order-2'>
            {/* Export button */}
            <button 
              onClick={() => handleExport(searchQuery, roleFilter, statusFilter)} 
              className='flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-base 
                         bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30
                         text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700
                         rounded-lg font-medium transition-all duration-200 min-h-[40px]'
            >
              <FiDownload className='text-base flex-shrink-0' />
              <span >Export Users Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions - improved mobile layout */}
      <div className='overflow-hidden'>
        <BulkActions
          selectedCount={selectedUsers.length}
          isSuperAdmin={!!isSuperAdmin}
          isOperationLoading={isOperationLoading}
          onBulkDelete={handleBulkDelete}
          onBulkUpdateRole={handleBulkUpdateRole}
          onBulkUpdateStatus={handleBulkUpdateStatus}
          onClearSelection={() => setSelectedUsers([])}
        />
      </div>

      {/* Modals */}
      {editingUser && (
        <UserProfileEdit 
          userId={editingUser} 
          onClose={() => setEditingUser(null)} 
        />
      )}
      {viewingUser && (
        <UserDetailsModal
          userId={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={() => {
            setEditingUser(viewingUser);
            setViewingUser(null);
          }}
        />
      )}

      {/* Data Table with mobile-optimized container */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
        <DataTable
          tableName='v_user_profiles_extended'
          data={users as unknown as Row<"v_user_profiles_extended">[]}
          columns={columns}
          loading={isLoading || isOperationLoading}
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalCount,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageLimit(pageSize);
            },
          }}
          actions={actions}
          selectable={true}
          exportable={true}
          exportOptions={{
            fileName: `users-export-${new Date().toISOString()}.xlsx`,
            rpcConfig: {
              functionName: "admin_get_all_users_extended",
              parameters: {
                search_query: debouncedSearchQuery || undefined,
                filter_role: roleFilter || undefined,
                filter_status: statusFilter || undefined,
                filter_email_verified: emailVerificationFilter ? emailVerificationFilter === "verified" : undefined,
              },
            },
          }}
          onRowSelect={(selectedRows) => {
            setSelectedUsers(selectedRows.map((row) => row.id).filter((id): id is string => id !== null));
          }}
          searchable={false}
          filterable={false}
          customToolbar={customToolbar}
        />
      </div>
    </div>
  );
};

export default AdminUsersPage;