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
  Employee_designationsRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { FiUsers, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { createStandardActions } from '@/components/table/action-helpers';
import { TableAction } from '@/components/table/datatable-types';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import { toast } from 'sonner';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useEmployeesData } from '@/hooks/data/useEmployeesData';
import { useUser } from '@/providers/UserProvider';
import { Row } from '@/hooks/database';
import { EmployeeCard } from '@/components/employee/EmployeeCard'; // NEW IMPORT
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect } from '@/components/common/ui';
import { UserRole } from '@/types/user-roles';

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
    dataQueryHook: useEmployeesData,
    displayNameField: 'employee_name',
  });

  // Fetch Options
  const { data: designationsData } = useOfflineQuery<Employee_designationsRowSchema[]>(
    ['all-designations-filter'],
    async () => (await createClient().from('employee_designations').select('*')).data ?? [],
    async () => await localDb.employee_designations.toArray()
  );
  const designations = useMemo(() => designationsData || [], [designationsData]);

  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['all-maintenance-areas-filter'],
    async () =>
      (await createClient().from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );
  const maintenanceAreas = useMemo(() => maintenanceAreasData || [], [maintenanceAreasData]);

  // Options Mappers
  const desOptions = useMemo(
    () => designations.map((d) => ({ value: d.id, label: d.name })),
    [designations]
  );
  const areaOptions = useMemo(
    () => maintenanceAreas.map((a) => ({ value: a.id, label: a.name })),
    [maintenanceAreas]
  );

  // Table Logic
  const columns = useMemo(() => getEmployeeTableColumns(), []);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_employees]);
  const isInitialLoad = isLoading && employees.length === 0;

  const tableActions = useMemo(
    () =>
      createStandardActions<V_employeesRowSchema>({
        onView: viewModal.open,
        onEdit: editModal.openEdit,
        onToggleStatus: isSuperAdmin ? crudActions.handleToggleStatus : undefined,
        onDelete: isSuperAdmin ? crudActions.handleDelete : undefined,
      }) as TableAction<'v_employees'>[],
    [
      viewModal.open,
      editModal.openEdit,
      isSuperAdmin,
      crudActions.handleToggleStatus,
      crudActions.handleDelete,
    ]
  );

  const headerActions = useStandardHeaderActions<'employees'>({
    data: employees as EmployeesRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'employees' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Employees' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  // Render Mobile (always List Card)
  const renderMobileItem = useCallback(
    (record: Row<'v_employees'>) => {
      return (
        <EmployeeCard
          employee={record as V_employeesRowSchema}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canDelete={!!isSuperAdmin}
          canEdit={!!isSuperAdmin || !!(role === UserRole.ADMIN)}
          viewMode="list"
        />
      );
    },
    [editModal.openEdit, crudActions.handleDelete, isSuperAdmin, role]
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

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
        <div className="w-full lg:w-96">
          <Input
            placeholder="Search employees..."
            value={search.searchQuery}
            onChange={(e) => search.setSearchQuery(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[180px]">
            <SearchableSelect
              placeholder="Designation"
              options={desOptions}
              value={filters.filters.employee_designation_id as string}
              onChange={(v) =>
                filters.setFilters((prev) => ({ ...prev, employee_designation_id: v }))
              }
              clearable
            />
          </div>
          <div className="min-w-[180px]">
            <SearchableSelect
              placeholder="Area"
              options={areaOptions}
              value={filters.filters.maintenance_terminal_id as string}
              onChange={(v) =>
                filters.setFilters((prev) => ({ ...prev, maintenance_terminal_id: v }))
              }
              clearable
            />
          </div>
          {/* View Toggle (Hidden on Mobile) */}
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table View"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="employee"
        showStatusUpdate={true}
      />

      {/* Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={editModal.openEdit}
              onDelete={crudActions.handleDelete}
              canDelete={!!isSuperAdmin}
              canEdit={!!isSuperAdmin || !!(role === UserRole.ADMIN)}
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
          selectable={!!isSuperAdmin}
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
          // Disable default toolbar since we have a custom one above
          customToolbar={<></>}
          // Mobile render
          renderMobileItem={renderMobileItem}
        />
      )}

      <EmployeeForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        employee={editModal.record}
        onSubmit={crudActions.handleSave}
        onCancel={editModal.close}
        isLoading={isMutating}
        designations={designations}
        maintenanceAreas={maintenanceAreas}
      />

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
