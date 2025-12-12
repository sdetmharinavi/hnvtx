// app/dashboard/employees/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, StatusBadge } from '@/components/common/ui';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeFilters from '@/components/employee/EmployeeFilters';
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
import { FiBriefcase, FiUsers } from 'react-icons/fi';
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

const EmployeesPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { isSuperAdmin } = useUser()
  // Removed: createClient and useTableUpdate manually. 
  // useCrudManager now handles updates via handleCellEdit.

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
    actions: crudActions, // handleCellEdit is now available here
  } = useCrudManager<'employees', V_employeesRowSchema>({
    tableName: 'employees',
    dataQueryHook: useEmployeesData,
    displayNameField: 'employee_name',
  });

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

  const columns = useMemo(() => getEmployeeTableColumns(), []);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_employees]);
  const isInitialLoad = isLoading && employees.length === 0;
  
  const tableActions = useMemo(
    () =>
      createStandardActions<V_employeesRowSchema>({
        onView: viewModal.open,
        onEdit: editModal.openEdit,
        onToggleStatus: isSuperAdmin ? crudActions.handleToggleStatus : undefined,
        onDelete:  isSuperAdmin ? crudActions.handleDelete : undefined,
      }) as TableAction<'v_employees'>[],
    [viewModal.open, editModal.openEdit, isSuperAdmin, crudActions.handleToggleStatus, crudActions.handleDelete]
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

  const renderMobileItem = useCallback((record: Row<'v_employees'>, actions: React.ReactNode) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-sm">
                {record.employee_name?.charAt(0)}
             </div>
             <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{record.employee_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                   <FiBriefcase className="w-3 h-3" />
                   <span>{record.employee_designation_name || 'No Designation'}</span>
                </div>
             </div>
          </div>
          {actions}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
               <span className="block text-gray-400 text-[10px] uppercase">ID</span>
               <span className="font-mono text-gray-700 dark:text-gray-300">{record.employee_pers_no || '-'}</span>
            </div>
            <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
               <span className="block text-gray-400 text-[10px] uppercase">Contact</span>
               <span className="text-gray-700 dark:text-gray-300 truncate block">{record.employee_contact || '-'}</span>
            </div>
        </div>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
             <span className="text-xs text-gray-500 truncate max-w-[150px]">
               {record.maintenance_area_name}
             </span>
             <StatusBadge status={record.status ?? false} />
        </div>
      </div>
    );
  }, []);

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="mx-auto space-y-4 p-6">
      <PageHeader
        title="Employee Management"
        description="View, add, and manage all employee records."
        icon={<FiUsers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="employee"
        showStatusUpdate={true}
      />
           <DataTable
      autoHideEmptyColumns={true}
        tableName="v_employees"
        data={employees}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        selectable={isSuperAdmin ? true : false}
        renderMobileItem={renderMobileItem}
        onRowSelect={(selectedRows) => {
          const validRows = selectedRows.filter(
            (row): row is V_employeesRowSchema & { id: string } => row.id != null
          );
          bulkActions.handleRowSelect(validRows);
        }}
        // Use the generic handler provided by useCrudManager
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
        customToolbar={
          <EmployeeFilters
            searchQuery={search.searchQuery}
            filters={filters.filters}
            onSearchChange={search.setSearchQuery}
            setFilters={filters.setFilters}
            designations={designations}
            maintenanceAreas={maintenanceAreas}
            showFilters={showFilters}
            onFilterToggle={() => setShowFilters(!showFilters)}
          />
        }
      />
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
};

export default EmployeesPage;