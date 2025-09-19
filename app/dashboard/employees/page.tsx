'use client';

import React, { useMemo, useState } from 'react';
import { FiDownload, FiPlus } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import {
  TableInsert,
  usePagedEmployeesWithCount,
  useTableQuery,
} from '@/hooks/database';
import { DataTable } from '@/components/table/DataTable';
import { Row } from '@/hooks/database';
import { Button, ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeFilters from '@/components/employee/EmployeeFilters';
import { getEmployeeTableColumns } from '@/components/employee/EmployeeTableColumns';
import { getEmployeeTableActions } from '@/components/employee/EmployeeTableActions';
import { EmployeeWithRelations } from '@/components/employee/employee-types';
import { BulkActions } from '@/components/common/BulkActions';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { EmployeeRowsWithCount } from '@/types/view-row-types';
import { EmployeesRowSchema } from '@/schemas/zod-schemas';

// 1. ADAPTER HOOK
const useEmployeesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<EmployeeRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const supabase = createClient();

  const { data, isLoading, error, refetch } = usePagedEmployeesWithCount(
    supabase,
    {
      filters: {
        ...filters,
        ...(searchQuery ? { employee_name: searchQuery } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  };
};

const EmployeesPage = () => {
  const [showFilters, setShowFilters] = useState(false);

  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: employeesData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    // isMutating,
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
  } = useCrudManager<'employees', EmployeeRowsWithCount>({
    tableName: 'employees',
    dataQueryHook: useEmployeesData,
    processDataForSave: (data) => {
      // Employee-specific date logic
      if (data.employee_dob) data.employee_dob = new Date(data.employee_dob);
      if (data.employee_doj) data.employee_doj = new Date(data.employee_doj);
      return data as TableInsert<'employees'>;
    },
  });

  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(
    null
  );

  const supabase = createClient();
  const { data: designations = [] } = useTableQuery(
    supabase,
    'employee_designations',
    { orderBy: [{ column: 'name' }] }
  );
  const { data: maintenanceAreas = [] } = useTableQuery(
    supabase,
    'maintenance_areas',
    { filters: { status: true }, orderBy: [{ column: 'name' }] }
  );

  const columns = useMemo(
    () =>
      getEmployeeTableColumns({
        designationMap: Object.fromEntries(
          designations.map((d) => [d.id, d.name])
        ),
        areaMap: Object.fromEntries(
          maintenanceAreas.map((a) => [a.id, a.name])
        ),
      }),
    [designations, maintenanceAreas]
  );

  const tableActions = useMemo(
    () =>
      getEmployeeTableActions({
        onView: (id) => setViewingEmployeeId(id),
        onEdit: (id) => {
          const emp = employeesData.find((e) => e.id === id);
          if (emp) editModal.openEdit(emp);
        },
        onToggleStatus: (record) => crudActions.handleToggleStatus(record),
        onDelete: (employeeId, displayName = 'this employee') =>
          crudActions.handleDelete({ id: employeeId, name: displayName }),
      }),
    [employeesData, editModal, crudActions]
  );

  // Download Configurations
  const exportColumns = useDynamicColumnConfig('employees', {
    data: employeesData as EmployeesRowSchema[],
  });
  const tableExcelDownload = useTableExcelDownload(supabase, 'employees', {
    onSuccess: () => {
      toast.success('Export successful');
    },
    onError: () => toast.error('Export failed'),
  });

  const handleExport = async () => {
    const tableName = 'employees';
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-${String(
        tableName
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: exportColumns,
      // filters: filters.filters,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetch,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Employee Management ({totalCount})
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<FiDownload />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button onClick={editModal.openAdd} leftIcon={<FiPlus />}>
            Add Employee
          </Button>
        </div>
      </div>
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isLoading}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="employee"
        showStatusUpdate={true}
      />

      <DataTable
        tableName="employees"
        data={employeesData as EmployeesRowSchema[]}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows) => {
          // Filter out any rows where id is null
          const validRows = selectedRows.filter(
            (
              row
            ): row is EmployeeRowsWithCount & {
              id: string;
              employee_name: string; // Ensure employee_name is not null
            } => row.id !== null && row.employee_name !== null
          );
          bulkActions.handleRowSelect(validRows);
        }}
        searchable={false} // Turn off internal search
        filterable={false} // Turn off internal filters
        showColumnsToggle={true}
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
            searchQuery={search.searchQuery} // <-- PASS THE SEARCH QUERY DOWN
            showFilters={showFilters}
            filters={filters.filters}
            onSearchChange={search.setSearchQuery}
            onFilterToggle={() => setShowFilters(!showFilters)}
            onDesignationChange={(value) =>
              filters.setFilters((prev) => ({
                ...prev,
                employee_designation_id: value,
              }))
            }
            onStatusChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, status: value }))
            }
            onMaintenanceAreaChange={(value) =>
              filters.setFilters((prev) => ({
                ...prev,
                maintenance_terminal_id: value,
              }))
            }
            designations={designations}
            maintenanceAreas={maintenanceAreas}
          />
        }
      />

      <EmployeeForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        employee={editModal.record as EmployeeWithRelations | null}
        onSubmit={crudActions.handleSave}
        onCancel={editModal.close}
        isLoading={isLoading}
        designations={designations}
        maintenanceAreas={maintenanceAreas}
      />
      <EmployeeDetailsModal
        employee={employeesData.find((e) => e.id === viewingEmployeeId)}
        onClose={() => setViewingEmployeeId(null)}
        isOpen={viewingEmployeeId !== null}
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
