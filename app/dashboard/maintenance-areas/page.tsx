'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { AreaFormModal } from '@/components/maintenance-areas/AreaFormModal';
import { useMaintenanceAreasMutations } from '@/components/maintenance-areas/useMaintenanceAreasMutations';
import { areaConfig, MaintenanceAreaWithRelations } from '@/config/areas';
import { MaintenanceAreaDetailsModal } from '@/config/maintenance-area-details-config';
import { Filters, PagedQueryResult, Row } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { Maintenance_areasInsertSchema, Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { toast } from 'sonner';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useMaintenanceAreasData } from '@/hooks/data/useMaintenanceAreasData';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { UseQueryResult } from '@tanstack/react-query';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';

export default function MaintenanceAreasPage() {
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<MaintenanceAreaWithRelations | null>(null);

  const {
    data: allAreas,
    totalCount, activeCount, inactiveCount,
    isLoading, isMutating, isFetching, error, refetch,
    search, filters,
  } = useCrudManager<'maintenance_areas', MaintenanceAreaWithRelations>({
    tableName: 'maintenance_areas',
    dataQueryHook: useMaintenanceAreasData,
    displayNameField: 'name',
    searchColumn: ['name', 'code', 'contact_person', 'email'],
  });

  // --- PERMISSIONS ---
  // Admins can Create/Edit
  const canEdit = isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;
  // Only Super Admin can Delete
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const selectedEntity = useMemo(() => allAreas.find(a => a.id === selectedAreaId) || null, [allAreas, selectedAreaId]);
  const isInitialLoad = isLoading && allAreas.length === 0;

  const { data: areaTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['maintenance-area-types-filter'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'MAINTENANCE_AREA_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'MAINTENANCE_AREA_TYPES' }).toArray()
  );
  const areaTypes = useMemo(() => areaTypesData || [], [areaTypesData]);

  const { createAreaMutation, updateAreaMutation, toggleStatusMutation, handleFormSubmit } = useMaintenanceAreasMutations(supabase, () => {
    refetch(); setFormOpen(false); setEditingArea(null);
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

  const handleOpenCreateForm = () => { setEditingArea(null); setFormOpen(true); };
  const handleOpenEditForm = (area: MaintenanceAreaWithRelations) => { setEditingArea(area); setFormOpen(true); };
  
  const headerActions = useStandardHeaderActions({
    data: allAreas as Row<'maintenance_areas'>[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    // THE FIX: Condition the "Add New" button
    onAddNew: canEdit ? handleOpenCreateForm : undefined, 
    isLoading: isLoading,
    exportConfig: canEdit ? { tableName: 'maintenance_areas' } : undefined,
  });
  
  const headerStats = [
    { value: totalCount, label: 'Total Areas' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error && isInitialLoad) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }
  
  // This is a workaround to satisfy the type expected by EntityManagementComponent
  const areasQuery: UseQueryResult<PagedQueryResult<MaintenanceAreaWithRelations>, Error> = {
    data: { data: allAreas, count: totalCount },
    isLoading, isFetching, error, isError: !!error, refetch,
  } as UseQueryResult<PagedQueryResult<MaintenanceAreaWithRelations>, Error>;
  
  return (
    <div className="p-4 md:p-6 dark:bg-gray-900 min-h-screen">
      <PageHeader 
        title="Maintenance Areas" 
        description="Manage maintenance areas, zones, and terminals." 
        icon={<FiMapPin />} 
        stats={headerStats} 
        actions={headerActions} 
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className="mb-4" 
      />
      
      <EntityManagementComponent<MaintenanceAreaWithRelations>
        config={areaConfig}
        entitiesQuery={areasQuery}
        isFetching={isFetching || isMutating}
        toggleStatusMutation={{ mutate: toggleStatusMutation.mutate, isPending: toggleStatusMutation.isPending }}
        // THE FIX: Pass permissions correctly
        onEdit={canEdit ? () => handleOpenEditForm(selectedEntity!) : undefined}
        onDelete={canDelete ? deleteManager.deleteSingle : undefined}
        onCreateNew={canEdit ? handleOpenCreateForm : undefined}
        selectedEntityId={selectedAreaId}
        onSelect={setSelectedAreaId}
        onViewDetails={() => setIsDetailsModalOpen(true)}
        searchTerm={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        filters={filters.filters as Record<string, string>}
        onFilterChange={(f) => filters.setFilters(f as Filters)}
        onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
      />

      {isFormOpen && (
        <AreaFormModal
          isOpen={isFormOpen} onClose={() => setFormOpen(false)}
          onSubmit={(data: Maintenance_areasInsertSchema) => handleFormSubmit(data, editingArea)}
          area={editingArea} allAreas={allAreas}
          isLoading={createAreaMutation.isPending || updateAreaMutation.isPending}
        />
      )}

      <MaintenanceAreaDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} area={selectedEntity} />
      
      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen} onConfirm={deleteManager.handleConfirm} onCancel={deleteManager.handleCancel}
        title="Confirm Deletion" message={deleteManager.confirmationMessage} confirmText="Delete" cancelText="Cancel"
        type="danger" showIcon loading={deleteManager.isPending}
      />
    </div>
  );
}