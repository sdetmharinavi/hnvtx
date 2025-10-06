// app/dashboard/employees/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeFilters from '@/components/employee/EmployeeFilters';
import { getEmployeeTableColumns } from '@/components/employee/EmployeeTableColumns';
import { DataTable } from '@/components/table/DataTable';
import { BulkActions } from '@/components/common/BulkActions';
import { Filters, usePagedData, useTableQuery } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import {
  V_employeesRowSchema,
  EmployeesInsertSchema,
  EmployeesRowSchema,
  Employee_designationsRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { FiUsers } from 'react-icons/fi';
import { createStandardActions } from '@/components/table/action-helpers';
import { TableAction } from '@/components/table/datatable-types';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import { toast } from 'sonner';

const useEmployeesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_employeesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const searchFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (searchQuery) {
      newFilters.or = {
        employee_name: searchQuery,
        employee_pers_no: searchQuery,
      };
    }
    return newFilters;
  }, [filters, searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_employeesRowSchema>(
    supabase,
    'v_employees',
    {
      filters: searchFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      orderBy: 'employee_name',
    }
  );

  return {
    data: data?.data || [],
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

const EmployeesPage = () => {
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    data: employees,
    totalCount, activeCount, inactiveCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, filters, editModal, viewModal, bulkActions, deleteModal, actions: crudActions,
  } = useCrudManager<'employees', V_employeesRowSchema>({
    tableName: 'employees',
    dataQueryHook: useEmployeesData,
  });

  // ** Restore the dedicated queries to fetch the full data structures.**
  const { data: designations = [] } = useTableQuery<"employee_designations", Employee_designationsRowSchema[]>(supabase, 'employee_designations', { orderBy: [{ column: 'name' }] });
  const { data: maintenanceAreas = [] } = useTableQuery<"maintenance_areas", Maintenance_areasRowSchema[]>(supabase, 'maintenance_areas', { filters: { status: true }, orderBy: [{ column: 'name' }] });

  const columns = useMemo(() => getEmployeeTableColumns({
    designationMap: Object.fromEntries(designations.map(d => [d.id, d.name])),
    areaMap: Object.fromEntries(maintenanceAreas.map(a => [a.id, a.name])),
  }), [designations, maintenanceAreas]);

  const tableActions = useMemo(
    () => createStandardActions<V_employeesRowSchema>({
      onView: viewModal.open,
      onEdit: editModal.openEdit,
      onToggleStatus: crudActions.handleToggleStatus,
      onDelete: crudActions.handleDelete,
    }) as TableAction<'v_employees'>[],
    [viewModal.open, editModal.openEdit, crudActions.handleToggleStatus, crudActions.handleDelete]
  );
  
  const headerActions = useStandardHeaderActions<'employees'>({
    data: employees as EmployeesRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'employees' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Employees' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleSaveEmployee = useCallback((data: EmployeesInsertSchema) => {
    crudActions.handleSave(data);
  }, [crudActions]);

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }

  return (
    <div className="mx-auto space-y-4 p-6">
      <PageHeader
        title="Employee Management"
        description="View, add, and manage all employee records."
        icon={<FiUsers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
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
        tableName="v_employees"
        data={employees}
        columns={columns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows) => {
            const validRows = selectedRows.filter(
                (row): row is V_employeesRowSchema & { id: string } => row.id != null
            );
            bulkActions.handleRowSelect(validRows);
        }}
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
        onSubmit={handleSaveEmployee}
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