// app/dashboard/employees/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { getEmployeeTableColumns } from '@/config/table-columns/EmployeeTableColumns';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_employeesRowSchema,
  EmployeesInsertSchema,
  EmployeesRowSchema,
} from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useEmployeesData } from '@/hooks/data/useEmployeesData';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { useMaintenanceAreaOptions, useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import { FiUsers, FiPhone, FiMail, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { useStandardHeaderActions } from '@/components/common/page-header';

const EmployeeForm = dynamic(
  () => import('@/components/employee/EmployeeForm').then((mod) => mod.default),
  { loading: () => <PageSpinner text="Loading Employee Form..." /> }
);

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { isSuperAdmin, role } = useUser();

  const {
    data: employees,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    isFetching,
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
  } = useCrudManager<'employees', V_employeesRowSchema>({
    tableName: 'employees',
    localTableName: 'v_employees',
    dataQueryHook: useEmployeesData,
    displayNameField: 'employee_name',
    syncTables: ['employees', 'v_employees', 'employee_designations', 'v_employee_designations'],
  });

  const canEdit = useMemo(
    () => isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO,
    [isSuperAdmin, role]
  );
  const canDelete = useMemo(() => isSuperAdmin || role === UserRole.ADMINPRO, [isSuperAdmin, role]);

  // --- THE FIX: Use useDropdownOptions to fetch designations instead of employees ---
  const { options: desOptions, isLoading: loadingDes } = useDropdownOptions({
    tableName: 'employee_designations',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
    orderBy: 'name',
    orderDir: 'asc',
  });

  const { options: areaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();

  // --- Filter Config ---
  const filterConfigs = useMemo(
    () => [
      {
        key: 'employee_designation_id',
        label: 'Designation',
        options: desOptions,
        isLoading: loadingDes,
      },
      {
        key: 'maintenance_terminal_id',
        label: 'Area',
        options: areaOptions,
        isLoading: loadingAreas,
      },
    ],
    [desOptions, areaOptions, loadingDes, loadingAreas]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters]
  );

  const columns = useMemo(() => getEmployeeTableColumns(), []);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_employees]);
  const isInitialLoad = isLoading && employees.length === 0;

  const headerActions = useStandardHeaderActions({
    data: employees as EmployeesRowSchema[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isInitialLoad,
    exportConfig: canEdit ? { tableName: 'employees' } : undefined,
  });

  // --- Helpers for Card Rendering ---
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-cyan-500 to-cyan-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {employees.map((emp) => (
        <GenericEntityCard
          key={emp.id}
          entity={emp}
          title={emp.employee_name || 'Unknown Employee'}
          subtitle={emp.employee_designation_name || 'No Designation'}
          initials={(emp.employee_name || '?')
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
          avatarColor={getAvatarColor(emp.employee_name || '')}
          status={emp.status}
          subBadge={
            emp.employee_pers_no ? (
              <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium">
                ID: {emp.employee_pers_no}
              </span>
            ) : null
          }
          dataItems={[
            { icon: FiPhone, label: 'Contact', value: emp.employee_contact || 'N/A' },
            { icon: FiMail, label: 'Email', value: emp.employee_email || 'N/A' },
            { icon: FiMapPin, label: 'Area', value: emp.maintenance_area_name || 'Unassigned' },
          ]}
          customFooter={
            emp.remark ? (
              <div className="flex gap-2 items-start text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded w-full">
                <FiMessageSquare className="shrink-0 mt-0.5" />
                <span className="truncate">{emp.remark}</span>
              </div>
            ) : null
          }
          onView={viewModal.open}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Employee Directory',
        description: 'Manage your team members and their contact details.',
        icon: <FiUsers />,
        actions: headerActions,
        stats: [
          { value: totalCount, label: 'Total Employees' },
          { value: activeCount, label: 'Active', color: 'success' },
          { value: inactiveCount, label: 'Inactive', color: 'danger' },
        ],
        isLoading: isInitialLoad,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder="Search employees..."
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={
        canEdit
          ? {
              selectedCount: bulkActions.selectedCount,
              isOperationLoading: isMutating,
              onBulkDelete: bulkActions.handleBulkDelete,
              onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
              onClearSelection: bulkActions.handleClearSelection,
              entityName: 'employee',
              canDelete: () => canDelete,
            }
          : undefined
      }
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_employees',
        data: employees,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: createStandardActions({
          onView: viewModal.open,
          onEdit: canEdit ? editModal.openEdit : undefined,
          onDelete: canDelete ? crudActions.handleDelete : undefined,
          onToggleStatus: canEdit ? crudActions.handleToggleStatus : undefined,
        }),
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_employeesRowSchema & { id: string } => !!row.id
          );
          bulkActions.handleRowSelect(validRows);
        },
        onCellEdit: crudActions.handleCellEdit,
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
      isEmpty={employees.length === 0 && !isLoading}
      emptyState={
        <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          No employees found matching your criteria.
        </div>
      }
      modals={
        <>
          {canEdit && (
            <EmployeeForm
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              employee={editModal.record}
              onSubmit={crudActions.handleSave as (data: EmployeesInsertSchema) => void}
              isLoading={isMutating}
              designationOptions={desOptions}
              maintenanceAreaOptions={areaOptions}
            />
          )}

          <EmployeeDetailsModal
            employee={viewModal.record}
            onClose={viewModal.close}
            isOpen={viewModal.isOpen}
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
        </>
      }
    />
  );
}
