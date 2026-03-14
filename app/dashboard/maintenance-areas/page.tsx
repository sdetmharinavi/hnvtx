// app/dashboard/maintenance-areas/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { areaConfig, MaintenanceAreaWithRelations } from '@/config/areas';
import { MaintenanceAreaDetailsModal } from '@/config/maintenance-area-details-config';
import { Filters, Row } from '@/hooks/database';
import { useMemo, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useMaintenanceAreasData } from '@/hooks/data/useMaintenanceAreasData';
import { StatProps } from '@/components/common/page-header/StatCard';

export default function MaintenanceAreasPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const {
    data: allAreas,
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
  } = useCrudManager<'maintenance_areas', MaintenanceAreaWithRelations>({
    tableName: 'maintenance_areas',
    dataQueryHook: useMaintenanceAreasData,
    displayNameField: 'name',
    searchColumn: ['name', 'code', 'contact_person', 'email'],
    syncTables: ['maintenance_areas', 'v_maintenance_areas'],
  });

  const selectedEntity = useMemo(
    () => allAreas.find((a) => a.id === selectedAreaId) || null,
    [allAreas, selectedAreaId],
  );
  const isInitialLoad = isLoading && allAreas.length === 0;

  const headerActions = useStandardHeaderActions({
    data: allAreas as Row<'maintenance_areas'>[],
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: { tableName: 'maintenance_areas' },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    return [
      {
        value: totalCount,
        label: 'Total Areas',
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
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );
  }

  return (
    <div className='p-4 md:p-6 dark:bg-gray-900 min-h-screen'>
      <PageHeader
        title='Maintenance Areas Viewer'
        description='View maintenance areas, zones, and terminals.'
        icon={<FiMapPin />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className='mb-4'
      />

      <EntityManagementComponent<MaintenanceAreaWithRelations>
        config={areaConfig}
        entitiesQuery={queryResult}
        isFetching={isFetching}
        selectedEntityId={selectedAreaId}
        onSelect={setSelectedAreaId}
        onViewDetails={() => setIsDetailsModalOpen(true)}
        searchTerm={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        filters={filters.filters as Record<string, string>}
        onFilterChange={(f) => filters.setFilters(f as Filters)}
        onClearFilters={() => {
          search.setSearchQuery('');
          filters.setFilters({});
        }}
      />

      <MaintenanceAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        area={selectedEntity}
      />
    </div>
  );
}
