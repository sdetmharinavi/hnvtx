// app/dashboard/ring-paths/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GiLinkedRings, GiPathDistance, GiRing } from 'react-icons/gi';
import { FiMapPin, FiActivity, FiArrowRightCircle, FiCheckCircle } from 'react-icons/fi';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { Button, ErrorDisplay, StatusBadge } from '@/components/common/ui';
import { DataGrid } from '@/components/common/DataGrid';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { StatProps } from '@/components/common/page-header/StatCard';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { createStandardActions } from '@/components/table/action-helpers';

import { useCrudManager } from '@/hooks/useCrudManager';
import { useRingsData } from '@/hooks/data/useRingsData';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { V_ringsRowSchema } from '@/schemas/zod-schemas';
import { PERMISSIONS } from '@/config/permissions';
import { useUser } from '@/providers/UserProvider';
import { DataTable } from '@/components/table';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { Row } from '@/hooks/database';

export default function RingPathsIndexPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // 1. Permissions
  const { canAccess } = useUser();
  const canManage = canAccess(PERMISSIONS.canManageRoutes);

  // 2. Data Fetching (Reusing Rings Data Hook)
  const {
    data: rings,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
    // ADDED IPs TO SEARCH CONFIG
    searchColumn: [
      'name',
      'description',
      'ring_type_name',
      'maintenance_area_name',
      'associated_system_names',
      'associated_system_ips',
    ] as any,
    // We sync with rings table changes
    syncTables: ['rings', 'v_rings'],
  });

  // 3. Dropdown Options for Filters
  const { options: ringTypeOptions, isLoading: loadingTypes } = useLookupTypeOptions('RING_TYPES');
  const { options: areaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();

  // 4. Header Actions
  const headerActions = useStandardHeaderActions({
    data: rings as Row<'v_rings'>[],
    onRefresh: refetch,
    isLoading,
    isFetching,
    // Provide a valid export config to prevent type inference issues
    exportConfig: {
      tableName: 'v_rings',
    },
  });

  // 5. Statistics
  const headerStats = useMemo<StatProps[]>(() => {
    const closedLoopCount = rings.filter((r) => r.is_closed_loop).length;
    const openLoopCount = rings.length - closedLoopCount;
    const readyForOfcCount = rings.filter((r) => r.ofc_status === 'Ready').length;

    return [
      {
        value: totalCount,
        label: 'Total Rings',
        color: 'default',
        onClick: () => filters.setFilters({}),
        isActive: Object.keys(filters.filters).length === 0,
      },
      {
        value: closedLoopCount,
        label: 'Protected (Closed)',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, is_closed_loop: 'true' })),
        isActive: filters.filters.is_closed_loop === 'true',
      },
      {
        value: openLoopCount,
        label: 'Linear (Open)',
        color: 'warning',
        onClick: () => filters.setFilters((prev) => ({ ...prev, is_closed_loop: 'false' })),
        isActive: filters.filters.is_closed_loop === 'false',
      },
      {
        value: readyForOfcCount,
        label: 'OFC Ready',
        color: 'primary',
        onClick: () => filters.setFilters((prev) => ({ ...prev, ofc_status: 'Ready' })),
        isActive: filters.filters.ofc_status === 'Ready',
      },
    ];
  }, [rings, totalCount, filters]);

  // 6. Filter Configuration
  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'ring_type_id',
        type: 'multi-select',
        options: ringTypeOptions,
        isLoading: loadingTypes,
        placeholder: 'Ring Type',
      },
      {
        key: 'maintenance_terminal_id',
        type: 'multi-select',
        options: areaOptions,
        isLoading: loadingAreas,
        placeholder: 'Maintenance Area',
      },
      {
        key: 'ofc_status',
        type: 'native-select',
        options: [
          { value: 'Ready', label: 'OFC Ready' },
          { value: 'Partial Ready', label: 'Partial Ready' },
          { value: 'Pending', label: 'Pending' },
        ],
        placeholder: 'OFC Status',
      },
    ],
    [ringTypeOptions, areaOptions, loadingTypes, loadingAreas],
  );

  // 7. Handlers
  const handleManagePaths = useCallback(
    (ringId: string | number | null | undefined) => {
      if (ringId == null) return;
      router.push(`/dashboard/ring-paths/${encodeURIComponent(String(ringId))}`);
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  // 8. Renderers
  const renderGridItem = useCallback(
    (ring: V_ringsRowSchema) => {
      const isClosed = ring.is_closed_loop;

      return (
        <GenericEntityCard
          key={ring.id}
          entity={ring}
          title={ring.name || 'Unnamed Ring'}
          status={ring.status}
          showStatusLabel={false}
          headerIcon={<GiLinkedRings className='w-6 h-6 text-indigo-500' />}
          subBadge={
            <div className='flex gap-2 mb-2'>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'>
                {ring.ring_type_name || 'Generic'}
              </span>
              {isClosed ? (
                <span
                  className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                  title='Protected Topology'>
                  <GiRing /> Closed Loop
                </span>
              ) : (
                <span
                  className='inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                  title='Linear Topology'>
                  <FiArrowRightCircle /> Open / Linear
                </span>
              )}
            </div>
          }
          dataItems={[
            {
              icon: FiMapPin,
              label: 'Area',
              value: ring.maintenance_area_name,
            },
            {
              icon: FiActivity,
              label: 'Nodes',
              // Explicitly cast to string to avoid type error with 'value' prop
              value: ring.total_nodes?.toString() || '0',
            },
            {
              icon: FiCheckCircle,
              label: 'OFC Status',
              value: <StatusBadge status={ring.ofc_status} />,
            },
          ]}
          customFooter={
            <div className='w-full'>
              <Button
                className='w-full'
                variant='primary'
                size='sm'
                onClick={() => handleManagePaths(ring.id!)}
                rightIcon={<GiPathDistance />}
                disabled={!canManage}>
                Manage Paths
              </Button>
            </div>
          }
          onView={() => handleManagePaths(ring.id!)}
        />
      );
    },
    [handleManagePaths, canManage],
  );

  // Table Configuration
  const columns = RingsColumns(rings);
  // FIX: Cast keys array to string[] to satisfy useOrderedColumns constraint
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_rings] as string[]);

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;
  }

  return (
    <DashboardPageLayout
      header={{
        title: 'Ring Path Management',
        description: 'Select a ring to configure logical paths, fibers, and service allocations.',
        icon: <GiPathDistance className='text-blue-600 dark:text-blue-400' />,
        stats: headerStats,
        actions: headerActions,
        isLoading,
        isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search rings or system IP...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      // No Bulk Actions needed here as this is a navigation directory

      renderGrid={() => (
        <DataGrid
          data={rings}
          renderItem={renderGridItem}
          isLoading={isLoading}
          isEmpty={rings.length === 0}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
        />
      )}
      renderTable={() => (
        <DataTable
          autoHideEmptyColumns
          tableName='v_rings'
          data={rings}
          columns={orderedColumns}
          loading={isLoading}
          isFetching={isFetching}
          // Only View/Manage action
          actions={createStandardActions({
            onView: (rec) => handleManagePaths(rec.id!),
            // Edit/Delete disabled here to separate concerns from Ring Manager
          })}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
        />
      )}
    />
  );
}
