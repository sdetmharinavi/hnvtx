// app/dashboard/employees/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { getEmployeeTableColumns } from '@/config/table-columns/EmployeeTableColumns';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_employeesRowSchema, EmployeesRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { EmployeeDetailsModal } from '@/config/employee-details-config';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useEmployeesData } from '@/hooks/data/useEmployeesData';
import { useMaintenanceAreaOptions, useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import { FiUsers, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { ErrorDisplay } from '@/components/common/ui';
import { useStandardHeaderActions } from '@/components/common/page-header';
import GenericRemarks from '@/components/common/GenericRemarks';
import { DataGrid } from '@/components/common/DataGrid';
import { StatProps } from '@/components/common/page-header/StatCard';

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    data: employees,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    viewModal,
  } = useCrudManager<'employees', V_employeesRowSchema>({
    tableName: 'employees',
    localTableName: 'v_employees',
    dataQueryHook: useEmployeesData,
    displayNameField: 'employee_name',
    syncTables: ['employees', 'v_employees', 'employee_designations', 'v_employee_designations'],
  });

  const { options: desOptions, isLoading: loadingDes } = useDropdownOptions({
    tableName: 'employee_designations',
    valueField: 'id',
    labelField: 'name',
    filters: { status: 'true' },
    orderBy: 'name',
    orderDir: 'asc',
  });

  const { options: areaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();

  const filterConfigs = useMemo(
    () => [
      {
        key: 'employee_designation_id',
        type: 'multi-select' as const,
        options: desOptions,
        isLoading: loadingDes,
      },
      {
        key: 'maintenance_terminal_id',
        type: 'multi-select' as const,
        options: areaOptions,
        isLoading: loadingAreas,
      },
    ],
    [desOptions, areaOptions, loadingDes, loadingAreas],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const columns = useMemo(
    () => getEmployeeTableColumns().map((c) => ({ ...c, editable: false })),
    [],
  );
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_employees]);
  const isInitialLoad = isLoading && employees.length === 0;

  const headerActions = useStandardHeaderActions({
    data: employees as EmployeesRowSchema[],
    onRefresh: refetch,
    isLoading: isInitialLoad,
    isFetching: isFetching,
    exportConfig: { tableName: 'employees' },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    return [
      {
        value: totalCount,
        label: 'Total Employees',
        color: 'default',
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
        label: 'Working',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Retired / Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
  }, [totalCount, activeCount, inactiveCount, filters]);

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

  const renderItem = useCallback(
    (emp: V_employeesRowSchema) => (
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
        showStatusLabel={false}
        subBadge={
          emp.employee_pers_no ? (
            <span className='inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full font-medium'>
              ID: {emp.employee_pers_no}
            </span>
          ) : null
        }
        dataItems={[
          { icon: FiPhone, label: 'Contact', value: emp.employee_contact || 'N/A' },
          { icon: FiMail, label: 'Email', value: emp.employee_email, optional: true },
          { icon: FiMapPin, label: 'Area', value: emp.maintenance_area_name, optional: true },
        ]}
        customFooter={<GenericRemarks remark={emp.remark || ''} />}
        onView={viewModal.open}
      />
    ),
    [viewModal.open],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={employees}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={employees.length === 0 && !isLoading}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
      />
    ),
    [employees, renderItem, isLoading, pagination, totalCount],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Employee Directory',
        description: 'View team members and contact details.',
        icon: <FiUsers />,
        actions: headerActions,
        stats: headerStats,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search employees...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_employees',
        data: employees,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching,
        actions: createStandardActions<'v_employees'>({ onView: viewModal.open }),
        selectable: false,
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
      }}
      isEmpty={employees.length === 0 && !isLoading}
      modals={
        <EmployeeDetailsModal
          employee={viewModal.record}
          onClose={viewModal.close}
          isOpen={viewModal.isOpen}
        />
      }
    />
  );
}
