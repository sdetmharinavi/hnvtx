// path: app/dashboard/maintenance-areas/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import dynamic from 'next/dynamic';
import { useMaintenanceAreasMutations } from '@/components/maintenance-areas/useMaintenanceAreasMutations';
import { areaConfig, MaintenanceAreaWithRelations } from '@/config/areas';
import { MaintenanceAreaDetailsModal } from '@/config/maintenance-area-details-config';
import { Filters, Row } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { Maintenance_areasInsertSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useMaintenanceAreasData } from '@/hooks/data/useMaintenanceAreasData';
import { useUser } from '@/providers/UserProvider';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added

const AreaFormModal = dynamic(
  () => import('@/components/maintenance-areas/AreaFormModal').then((mod) => mod.AreaFormModal),
  { loading: () => <PageSpinner text='Loading Area Form...' /> },
);

export default function MaintenanceAreasPage() {
  const supabase = createClient();

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<MaintenanceAreaWithRelations | null>(null);

  const {
    data: allAreas,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
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

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const selectedEntity = useMemo(
    () => allAreas.find((a) => a.id === selectedAreaId) || null,
    [allAreas, selectedAreaId],
  );
  const isInitialLoad = isLoading && allAreas.length === 0;

  const { createAreaMutation, updateAreaMutation, toggleStatusMutation, handleFormSubmit } =
    useMaintenanceAreasMutations(supabase, () => {
      refetch();
      setFormOpen(false);
      setEditingArea(null);
    });

  const deleteManager = useDeleteManager({
    tableName: 'maintenance_areas',
    onSuccess: () => {
      if (selectedAreaId && deleteManager.itemToDelete?.id === selectedAreaId) {
        setSelectedAreaId(null);
      }
      refetch();
    },
  });

  const handleOpenCreateForm = () => {
    setEditingArea(null);
    setFormOpen(true);
  };
  const handleOpenEditForm = (area: MaintenanceAreaWithRelations) => {
    setEditingArea(area);
    setFormOpen(true);
  };

  const headerActions = useStandardHeaderActions({
    data: allAreas as Row<'maintenance_areas'>[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canEdit ? handleOpenCreateForm : undefined,
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: canEdit ? { tableName: 'maintenance_areas' } : undefined,
  });

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Areas',
        color: 'default',
        // Click clears the status filter
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

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
        title='Maintenance Areas'
        description='Manage maintenance areas, zones, and terminals.'
        icon={<FiMapPin />}
        stats={headerStats} // Interactive Stats
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className='mb-4'
      />

      <EntityManagementComponent<MaintenanceAreaWithRelations>
        config={areaConfig}
        entitiesQuery={queryResult}
        isFetching={isFetching || isMutating}
        toggleStatusMutation={{
          mutate: toggleStatusMutation.mutate,
          isPending: toggleStatusMutation.isPending,
        }}
        onEdit={canEdit ? () => handleOpenEditForm(selectedEntity!) : undefined}
        onDelete={canDelete ? deleteManager.deleteSingle : undefined}
        onCreateNew={canEdit ? handleOpenCreateForm : () => {}}
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

      {isFormOpen && (
        <AreaFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(data: Maintenance_areasInsertSchema) => handleFormSubmit(data, editingArea)}
          area={editingArea}
          allAreas={allAreas}
          isLoading={createAreaMutation.isPending || updateAreaMutation.isPending}
        />
      )}

      <MaintenanceAreaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        area={selectedEntity}
      />

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
        showIcon
        loading={deleteManager.isPending}
      />
    </div>
  );
}
