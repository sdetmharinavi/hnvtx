// app/dashboard/employees/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import EmployeeForm from '@/components/employee/EmployeeForm';
import { getEmployeeTableColumns } from '@/config/table-columns/EmployeeTableColumns';
import { DataTable } from '@/components/table/DataTable';
import { BulkActions } from '@/components/common/BulkActions';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_employeesRowSchema,
  EmployeesRowSchema,
  EmployeesInsertSchema,
} from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { TableAction } from '@/components/table/datatable-types';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import { toast } from 'sonner';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useEmployeesData } from '@/hooks/data/useEmployeesData';
import { useUser } from '@/providers/UserProvider';
import { Row } from '@/hooks/database';
import { EmployeeCard } from '@/components/employee/EmployeeCard';
import { UserRole } from '@/types/user-roles';
import { useDropdownOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { FiUsers } from 'react-icons/fi';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; // NEW

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
  });

  const canEdit = useMemo(
    () => isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO,
    [isSuperAdmin, role]
  );
  const canDelete = useMemo(() => isSuperAdmin || role === UserRole.ADMINPRO, [isSuperAdmin, role]);

  const { options: desOptions, isLoading: loadingDes } = useDropdownOptions({
    tableName: 'employee_designations',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
    orderBy: 'name',
  });

  const { options: areaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();

  // --- DRY IMPLEMENTATION: FILTER CONFIG ---
  const filterConfigs = useMemo<FilterConfig[]>(
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

  // Handle generic filter change
  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [filters]
  );
  // ----------------------------------------

  const columns = useMemo(() => getEmployeeTableColumns(), []);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_employees]);
  const isInitialLoad = isLoading && employees.length === 0;

  const tableActions = useMemo(
    () =>
      createStandardActions<V_employeesRowSchema>({
        onView: viewModal.open,
        onEdit: canEdit ? editModal.openEdit : undefined,
        onToggleStatus: canEdit ? crudActions.handleToggleStatus : undefined,
        onDelete: canDelete ? crudActions.handleDelete : undefined,
      }) as TableAction<'v_employees'>[],
    [
      viewModal.open,
      editModal.openEdit,
      crudActions.handleToggleStatus,
      crudActions.handleDelete,
      canEdit,
      canDelete,
    ]
  );

  const headerActions = useStandardHeaderActions<'employees'>({
    data: employees as EmployeesRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    exportConfig: canEdit ? { tableName: 'employees' } : undefined,
  });

  const headerStats = [
    { value: totalCount, label: 'Total Employees' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const renderMobileItem = useCallback(
    (record: Row<'v_employees'>) => {
      return (
        <EmployeeCard
          employee={record as V_employeesRowSchema}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canDelete={canDelete}
          canEdit={canEdit}
          viewMode="list"
        />
      );
    },
    [editModal.openEdit, crudActions.handleDelete, canEdit, canDelete]
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="Employee Directory"
        description="Manage your team members and their contact details."
        icon={<FiUsers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />

      {/* REPLACED MANUAL LAYOUT WITH GENERIC FILTER BAR */}
      <GenericFilterBar
        searchQuery={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        searchPlaceholder="Search employees..."
        filters={filters.filters}
        onFilterChange={handleFilterChange}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {canEdit && (
        <BulkActions
          selectedCount={bulkActions.selectedCount}
          isOperationLoading={isMutating}
          onBulkDelete={bulkActions.handleBulkDelete}
          onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
          onClearSelection={bulkActions.handleClearSelection}
          entityName="employee"
          showStatusUpdate={true}
          canDelete={() => canDelete}
        />
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={editModal.openEdit}
              onDelete={crudActions.handleDelete}
              canDelete={canDelete}
              canEdit={canEdit}
            />
          ))}
          {employees.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              No employees found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        <DataTable
          tableName="v_employees"
          data={employees}
          columns={orderedColumns}
          loading={isLoading}
          isFetching={isFetching || isMutating}
          actions={tableActions}
          selectable={canDelete}
          onRowSelect={(selectedRows) => {
            const validRows = selectedRows.filter(
              (row): row is V_employeesRowSchema & { id: string } => row.id != null
            );
            bulkActions.handleRowSelect(validRows);
          }}
          onCellEdit={crudActions.handleCellEdit}
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
          customToolbar={<></>} // Custom toolbar hidden as we use GenericFilterBar
          renderMobileItem={renderMobileItem}
        />
      )}

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
    </div>
  );
}
