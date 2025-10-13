// app/dashboard/employees/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeFilters from '@/components/employee/EmployeeFilters';
import { getEmployeeTableColumns } from '@/components/employee/EmployeeTableColumns';
import { DataTable } from '@/components/table/DataTable';
import { BulkActions } from '@/components/common/BulkActions';
import { buildRpcFilters } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import {
  V_employeesRowSchema,
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
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';
import { DEFAULTS } from '@/constants/constants';

const useEmployeesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_employeesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = async (): Promise<V_employeesRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(employee_name.ilike.%${searchQuery}%,employee_pers_no.ilike.%${searchQuery}%,employee_email.ilike.%${searchQuery}%,employee_contact.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employees',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
    });
    if (error) throw error;
    return (data as { data: V_employeesRowSchema[] })?.data || [];
  };

  const offlineQueryFn = async (): Promise<V_employeesRowSchema[]> => {
    return await localDb.v_employees.toArray();
  };

  const {
    data: allEmployees = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOfflineQuery(['employees-data', searchQuery, filters], onlineQueryFn, offlineQueryFn, {
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    let filtered = allEmployees;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp: V_employeesRowSchema) =>
          emp.employee_name?.toLowerCase().includes(lowerQuery) ||
          emp.employee_pers_no?.toLowerCase().includes(lowerQuery) ||
          emp.employee_email?.toLowerCase().includes(lowerQuery) ||
          emp.employee_contact?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.employee_designation_id) {
      filtered = filtered.filter(
        (emp: V_employeesRowSchema) =>
          emp.employee_designation_id === filters.employee_designation_id
      );
    }
    if (filters.maintenance_terminal_id) {
      filtered = filtered.filter(
        (emp: V_employeesRowSchema) =>
          emp.maintenance_terminal_id === filters.maintenance_terminal_id
      );
    }
    if (filters.status) {
      const statusBool = filters.status === 'true';
      filtered = filtered.filter((emp: V_employeesRowSchema) => emp.status === statusBool);
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n: V_employeesRowSchema) => n.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allEmployees, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};

const EmployeesPage = () => {
  const [showFilters, setShowFilters] = useState(false);

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
        onToggleStatus: crudActions.handleToggleStatus,
        onDelete: crudActions.handleDelete,
      }) as TableAction<'v_employees'>[],
    [viewModal.open, editModal.openEdit, crudActions.handleToggleStatus, crudActions.handleDelete]
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
        tableName="v_employees"
        data={employees}
        columns={orderedColumns}
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
