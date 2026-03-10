// app/dashboard/systems/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  FiDatabase,
  FiRefreshCw,
  FiCpu,
  FiMapPin,
  FiActivity,
  FiGrid,
  FiTag,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { ErrorDisplay } from '@/components/common/ui';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import { Row } from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { createStandardActions } from '@/components/table/action-helpers';
import { formatDate, formatIP } from '@/utils/formatters';
import { useSystemsData } from '@/hooks/data/useSystemsData';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { ActionButton } from '@/components/common/page-header';
import { DataGrid } from '@/components/common/DataGrid';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { CiCalendarDate } from 'react-icons/ci';
import GenericRemarks from '@/components/common/GenericRemarks';
import { StatProps } from '@/components/common/page-header/StatCard';

export default function SystemsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const {
    data: systems,
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
  } = useCrudManager<'systems', V_systems_completeRowSchema>({
    tableName: 'systems',
    localTableName: 'v_systems_complete',
    dataQueryHook: useSystemsData,
    searchColumn:['system_name', 'system_type_name', 'node_name', 'ip_address'],
    displayNameField: 'system_name',
    syncTables:[
      'systems',
      'v_systems_complete',
      'ring_based_systems',
      'ports_management',
      'v_ports_management_complete',
      'system_connections',
      'v_system_connections_complete',
    ],
  });

  const { options: systemTypeOptions, isLoading: loadingTypes } =
    useLookupTypeOptions('SYSTEM_TYPES');
  const { options: capacityOptions, isLoading: loadingCaps } =
    useLookupTypeOptions('SYSTEM_CAPACITY');
  const { options: maintenanceAreaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();

  const filterConfigs = useMemo<FilterConfig[]>(
    () =>[
      {
        key: 'system_type_id',
        type: 'multi-select' as const,
        options: systemTypeOptions,
        isLoading: loadingTypes,
        placeholder: 'All Types',
      },
      {
        key: 'system_capacity_id',
        type: 'multi-select' as const,
        options: capacityOptions,
        isLoading: loadingCaps,
        placeholder: 'All Capacities',
      },
      {
        key: 'maintenance_terminal_id',
        type: 'multi-select' as const,
        options: maintenanceAreaOptions,
        isLoading: loadingAreas,
        placeholder: 'All Areas',
      },
      {
        key: 'status',
        type: 'native-select' as const,
        placeholder: 'All Status',
        options:[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],[systemTypeOptions, capacityOptions, maintenanceAreaOptions, loadingTypes, loadingCaps, loadingAreas]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters]
  );

  const isInitialLoad = isLoading && systems.length === 0;

  const handleView = useCallback(
    (system: V_systems_completeRowSchema) => {
      if (system.id) router.push(`/dashboard/systems/${system.id}`);
      else toast.info('Invalid system ID.');
    },
    [router]
  );

  const columns = SystemsTableColumns(systems);
  const orderedSystems = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_systems_complete]);

  const tableActions = useMemo(() => {
    return createStandardActions<V_systems_completeRowSchema>({
      onView: handleView,
    });
  }, [handleView]);

  const headerActions = useMemo((): ActionButton[] => {
    return[
      {
        label: 'Refresh',
        onClick: () => {
          refetch();
          toast.success('Systems refreshed.');
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={(isLoading || isFetching) ? 'animate-spin' : ''} />,
        disabled: isLoading || isFetching,
      },
    ];
  }, [isLoading, isFetching, refetch]);

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return[
      {
        value: totalCount,
        label: 'Total Systems',
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
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
  },[totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  const renderItem = useCallback(
    (sys: V_systems_completeRowSchema) => (
      <GenericEntityCard
        key={sys.id}
        entity={sys}
        title={sys.system_name || 'Unnamed System'}
        status={sys.status}
        showStatusLabel={false}
        subBadge={
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <span className='inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50'>
              {sys.system_type_code || sys.system_type_name}
            </span>
            {sys.is_hub && (
              <span className='inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50'>
                HUB
              </span>
            )}
          </div>
        }
        dataItems={[
          { icon: FiMapPin, label: 'Location', value: sys.node_name, optional: true },
          { icon: FiActivity, label: 'IP Address', value: formatIP(sys.ip_address), optional: true },
          { icon: FiCpu, label: 'Capacity', value: sys.system_capacity_name, optional: true },
          { icon: FiTag, label: 'Asset No', value: sys.asset_no, optional: true },
          { icon: CiCalendarDate, label: 'Commissioning Date', value: sys.commissioned_on, optional: true },
        ]}
        customFooter={
          <div className='w-full'>
            <GenericRemarks remark={sys.remark || ''} />
          </div>
        }
        onView={handleView}
      />
    ),
    [handleView]
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={systems}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={systems.length === 0 && !isLoading}
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
    ),[systems, renderItem, isLoading, totalCount, pagination]
  );

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'System Viewer',
        description: 'Read-only view of network systems, including CPAN, MAAN, SDH, DWDM etc.',
        icon: <FiDatabase />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search system, node, IP...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_systems_complete',
        data: systems,
        columns: orderedSystems,
        loading: isLoading,
        isFetching: isFetching,
        actions: tableActions,
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
      isEmpty={systems.length === 0 && !isLoading}
    />
  );
}