// app/dashboard/rings/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GiLinkedRings } from 'react-icons/gi';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { createStandardActions } from '@/components/table/action-helpers';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useRingsData } from '@/hooks/data/useRingsData';
import {
  V_ringsRowSchema,
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { Row } from '@/hooks/database';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { StatProps } from '@/components/common/page-header/StatCard';

const STATUS_OPTIONS = {
  OFC:[
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial Ready', label: 'Partial Ready' },
    { value: 'Ready', label: 'Ready' },
  ],
  SPEC:[
    { value: 'Pending', label: 'Pending' },
    { value: 'Survey', label: 'Survey' },
    { value: 'Issued', label: 'Issued' },
  ],
  BTS:[
    { value: 'Pending', label: 'Pending' },
    { value: 'Configured', label: 'Configured' },
    { value: 'On-Air', label: 'On-Air' },
  ],
};

export default function RingsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

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
    localTableName: 'v_rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
    searchColumn:['name', 'description', 'ring_type_name', 'maintenance_area_name'],
    syncTables: ['rings', 'v_rings', 'ring_based_systems'],
  });

  const { originalData: ringTypesRaw, isLoading: isLoadingRingTypes } =
    useLookupTypeOptions('RING_TYPES');

  const { originalData: maintenanceAreasRaw, isLoading: isLoadingAreas } =
    useMaintenanceAreaOptions();

  const ringTypes = useMemo(() => (ringTypesRaw || []) as Lookup_typesRowSchema[],[ringTypesRaw]);
  const maintenanceAreas = useMemo(
    () => (maintenanceAreasRaw ||[]) as Maintenance_areasRowSchema[],
    [maintenanceAreasRaw]
  );

  const ringTypeFilterOptions = useMemo(
    () =>
      ringTypes.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [ringTypes]
  );

  const maintenanceAreaFilterOptions = useMemo(
    () =>
      maintenanceAreas.map((a) => ({
        value: a.id,
        label: a.name,
      })),[maintenanceAreas]
  );

  const headerStats = useMemo<StatProps[]>(() => {
    const s = {
      spec: { issued: 0, pending: 0 },
      ofc: { ready: 0, partial: 0, pending: 0 },
      bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 },
    };
    let nodesSum = 0;

    rings.forEach((r) => {
      nodesSum += r.total_nodes || 0;
      if (r.spec_status === 'Issued') s.spec.issued++;
      else s.spec.pending++;
      if (r.ofc_status === 'Ready') s.ofc.ready++;
      else if (r.ofc_status === 'Partial Ready') s.ofc.partial++;
      else s.ofc.pending++;
      if (r.bts_status === 'On-Air') {
        s.bts.onAir++;
        s.bts.nodesOnAir += r.total_nodes ?? 0;
      } else if (r.bts_status === 'Configured') {
        s.bts.configuredCount++;
      } else {
        s.bts.pending++;
      }
    });

    const currentOfcFilter = filters.filters.ofc_status;
    const currentSpecFilter = filters.filters.spec_status;
    const currentBtsFilter = filters.filters.bts_status;

    return[
      {
        value: `${nodesSum} / ${totalCount}`,
        label: 'Total Nodes / Rings',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.ofc_status;
            delete next.spec_status;
            delete next.bts_status;
            return next;
          }),
        isActive: !currentOfcFilter && !currentSpecFilter && !currentBtsFilter,
      },
      {
        value: `${s.bts.nodesOnAir} / ${s.bts.configuredCount}`,
        label: 'Nodes On-Air / Rings Configured',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, bts_status: 'On-Air' })),
        isActive: currentBtsFilter === 'On-Air',
      },
      {
        value: `${s.spec.issued} / ${s.spec.pending}`,
        label: 'SPEC (Issued/Pend)',
        color: 'primary',
        onClick: () => filters.setFilters((prev) => ({ ...prev, spec_status: 'Issued' })),
        isActive: currentSpecFilter === 'Issued',
      },
      {
        value: `${s.ofc.ready} / ${s.ofc.partial} / ${s.ofc.pending}`,
        label: 'OFC (Ready/Partial/Pend)',
        color: 'warning',
        onClick: () => filters.setFilters((prev) => ({ ...prev, ofc_status: 'Ready' })),
        isActive: currentOfcFilter === 'Ready',
      },
    ];
  },[rings, totalCount, filters.filters.ofc_status, filters.filters.spec_status, filters.filters.bts_status, filters.setFilters]);

  // Disable inline cell editing by overriding the editable property inside RingsColumns
  // We can just pass standard actions without editing
  const columns = RingsColumns(rings, STATUS_OPTIONS).map(col => ({ ...col, editable: false }));
  const orderedColumns = useOrderedColumns(columns,[...TABLE_COLUMN_KEYS.v_rings]);

  const handleView = useCallback(
    (record: V_ringsRowSchema) => {
      if (record.id) router.push(`/dashboard/rings/${record.id}`);
    },
    [router]
  );

  const tableActions = useMemo(() => {
    return createStandardActions<V_ringsRowSchema>({
      onView: handleView,
    });
  }, [handleView]);

  const isInitialLoad = isLoading && rings.length === 0;

  const headerActions = useStandardHeaderActions({
    data: rings,
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    isFetching: isFetching,
  });

  const renderMobileItem = useCallback((record: Row<'v_rings'>, actions: React.ReactNode) => {
    return (
      <div className='flex flex-col gap-2'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-gray-100'>{record.name}</h3>
            <span className='inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'>
              {record.ring_type_name}
            </span>
          </div>
          {actions}
        </div>
      </div>
    );
  },[]);

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;
  }

  return (
    <div className='mx-auto space-y-4 p-6'>
      <PageHeader
        title='Ring Directory'
        description='View network rings and track phase progress.'
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className='mb-4'
      />

      <DataTable
        autoHideEmptyColumns={true}
        tableName='v_rings'
        data={rings}
        columns={orderedColumns}
        loading={isLoading}
        actions={tableActions}
        isFetching={isFetching}
        renderMobileItem={renderMobileItem}
        selectable={false}
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
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={() => filters.setFilters({})}
            hasActiveFilters={Object.values(filters.filters).some(Boolean)}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
          >
            <SelectFilter
              label='Ring Type'
              filterKey='ring_type_id'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={ringTypeFilterOptions}
              isLoading={isLoadingRingTypes}
            />
            <SelectFilter
              label='Maintenance Area'
              filterKey='maintenance_terminal_id'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={maintenanceAreaFilterOptions}
              isLoading={isLoadingAreas}
            />
            <SelectFilter
              label='OFC Status'
              filterKey='ofc_status'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.OFC}
            />
            <SelectFilter
              label='SPEC Status'
              filterKey='spec_status'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.SPEC}
            />
            <SelectFilter
              label='Working Status'
              filterKey='bts_status'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.BTS}
            />
            <SelectFilter
              label='Active Record'
              filterKey='status'
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </SearchAndFilters>
        }
      />
    </div>
  );
}