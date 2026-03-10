// app/dashboard/users/page.tsx
"use client";

import { useStandardHeaderActions } from "@/components/common/page-header";
import {
  ErrorDisplay,
  PageSpinner,
  RoleBadge,
  StatusBadge,
} from "@/components/common/ui";
import { UserProfileColumns } from "@/config/table-columns/UsersTableColumns";
import { UserDetailsModal } from "@/config/user-details-config";
import { Row } from "@/hooks/database";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useCallback, useMemo } from "react";
import { FiUsers } from "react-icons/fi";
import { V_user_profiles_extendedRowSchema } from "@/schemas/zod-schemas";
import { createStandardActions } from "@/components/table/action-helpers";
import { TableAction } from "@/components/table/datatable-types";
import { Json } from "@/types/supabase-types";
import { useUser } from "@/providers/UserProvider";
import { useUsersData } from "@/hooks/data/useUsersData";
import Image from "next/image";
import { UserRole } from "@/types/user-roles";
import { UnauthorizedModal } from "@/components/auth/UnauthorizedModal";
import { FilterConfig } from "@/components/common/filters/GenericFilterBar";
import { DashboardPageLayout } from "@/components/layouts/DashboardPageLayout";
import { StatProps } from "@/components/common/page-header/StatCard";

const AdminUsersPage = () => {
  const { isSuperAdmin, role, isLoading: isUserLoading } = useUser();

  const crud = useCrudManager<
    "user_profiles",
    V_user_profiles_extendedRowSchema
  >({
    tableName: "user_profiles",
    dataQueryHook: useUsersData,
  });

  const {
    data: users,
    totalCount,
    isLoading,
    error,
    refetch,
    pagination,
    viewModal,
    filters,
  } = crud;

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: "role",
        label: "Role",
        type: "native-select",
        options: Object.values(UserRole).map((r) => ({
          value: r,
          label: r.replace(/_/g, " ").toUpperCase(),
        })),
      },
      {
        key: "status",
        label: "Status",
        type: "native-select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ],
      },
      {
        key: "is_email_verified",
        label: "Email Status",
        type: "native-select",
        options: [
          { value: "true", label: "Verified" },
          { value: "false", label: "Unverified" },
        ],
      },
    ],
    [],
  );

  const columns = UserProfileColumns(
    users as V_user_profiles_extendedRowSchema[],
  );

  const tableActions = useMemo(
    () =>
      createStandardActions<V_user_profiles_extendedRowSchema>({
        onView: viewModal.open,
      }) as TableAction<"v_user_profiles_extended">[],
    [viewModal.open],
  );

  const headerActions = useStandardHeaderActions<"user_profiles">({
    data: users as Row<"user_profiles">[],
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    exportConfig: { tableName: "user_profiles" },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    const activeCount = users.filter((r) => r.status === "active").length;
    const inactiveCount = users.filter((r) => r.status !== "active").length;

    return [
      {
        value: totalCount,
        label: "Total Users",
        color: "default",
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: "Active",
        color: "success",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, status: "active" })),
        isActive: currentStatus === "active",
      },
      {
        value: inactiveCount,
        label: "Inactive/Suspended",
        color: "danger",
        onClick: () =>
          filters.setFilters((prev) => ({ ...prev, status: "inactive" })),
        isActive: currentStatus === "inactive",
      },
    ];
  }, [totalCount, users, filters.filters.status, filters.setFilters]);

  const renderMobileItem = useCallback(
    (record: Row<"v_user_profiles_extended">, actions: React.ReactNode) => {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {record.avatar_url ? (
                <Image
                  src={record.avatar_url}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold">
                  {record.first_name?.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {record.full_name}
                  {record.is_super_admin && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded border border-yellow-200">
                      SUPER
                    </span>
                  )}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {record.email}
                </div>
              </div>
            </div>
            {actions}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <RoleBadge role={record.role as UserRole} />
            {record.designation && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                {record.designation}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-400">
              Active: {record.last_activity_period || "Never"}
            </div>
            <StatusBadge status={record.status ?? "inactive"} />
          </div>
        </div>
      );
    },
    [],
  );

  if (isUserLoading) {
    return <PageSpinner text="Verifying permissions..." />;
  }

  // Ensure only PRO Admins and Super Admins can even view this page
  const allowedRoles = [UserRole.ADMINPRO];
  if (!isSuperAdmin && !allowedRoles.includes(role as UserRole)) {
    return <UnauthorizedModal allowedRoles={allowedRoles} currentRole={role} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: "Retry", onClick: refetch, variant: "primary" }]}
      />
    );
  }

  return (
    <DashboardPageLayout
      crud={crud}
      header={{
        title: "User Viewer",
        description:
          "Read-only view of network users and their related information.",
        icon: <FiUsers />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchPlaceholder="Search users by name or email..."
      filterConfigs={filterConfigs}
      renderGrid={() => (
        <div className="text-center p-8">Grid View Not Supported</div>
      )}
      tableProps={{
        tableName: "v_user_profiles_extended",
        data: users.map((user) => ({
          ...user,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          id: user.id || "",
          address: user.address as Json | null,
        })),
        columns: columns,
        loading: isLoading,
        actions: tableActions,
        selectable: false, // Read only, no selection
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
      modals={
        <UserDetailsModal
          isOpen={viewModal.isOpen}
          user={viewModal.record as V_user_profiles_extendedRowSchema}
          onClose={viewModal.close}
        />
      }
    />
  );
};

export default AdminUsersPage;
