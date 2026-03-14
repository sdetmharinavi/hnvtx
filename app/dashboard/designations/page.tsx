// app/dashboard/designations/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { designationConfig, DesignationWithRelations } from '@/config/designations';
import { Filters, Row } from '@/hooks/database';
import { useMemo, useState } from 'react';
import { ImUserTie } from 'react-icons/im';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useDesignationsData } from '@/hooks/data/useDesignationsData';
import { StatProps } from '@/components/common/page-header/StatCard';

export default function DesignationManagerPage() {
  const [selectedDesignationId, setSelectedDesignationId] = useState<string | null>(null);

  const {
    data: allDesignations,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    search,
    filters,
    queryResult,
  } = useCrudManager<'employee_designations', DesignationWithRelations>({
    tableName: 'employee_designations',
    dataQueryHook: useDesignationsData,
    searchColumn: 'name',
    syncTables: ['employee_designations', 'v_employee_designations'],
  });

  const isInitialLoad = isLoading && allDesignations.length === 0;

  const headerActions = useStandardHeaderActions({
    data: allDesignations as Row<'employee_designations'>[],
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    exportConfig: { tableName: 'employee_designations' },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    return [
      {
        value: totalCount,
        label: 'Total Designations',
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
  }, [totalCount, activeCount, inactiveCount, filters]);

  if (error && isInitialLoad) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: () => refetch(), variant: 'primary' }]}
      />
    );
  }

  return (
    <div className='p-4 md:p-6 dark:bg-gray-900 min-h-screen'>
      <PageHeader
        title='Designation Viewer'
        description='View company designations and hierarchies.'
        icon={<ImUserTie />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className='mb-4'
      />

      <EntityManagementComponent<DesignationWithRelations>
        config={designationConfig}
        entitiesQuery={queryResult}
        isFetching={isFetching}
        selectedEntityId={selectedDesignationId}
        onSelect={setSelectedDesignationId}
        searchTerm={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        filters={filters.filters as Record<string, string>}
        onFilterChange={(f) => filters.setFilters(f as Filters)}
        onClearFilters={() => {
          search.setSearchQuery('');
          filters.setFilters({});
        }}
      />
    </div>
  );
}
