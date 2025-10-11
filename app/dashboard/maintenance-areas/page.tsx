// path: app/dashboard/maintenance-areas/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal';
import { AreaFormModal } from '@/components/maintenance-areas/AreaFormModal';
import { useMaintenanceAreasMutations } from '@/components/maintenance-areas/useMaintenanceAreasMutations';
import { areaConfig, MaintenanceAreaWithRelations } from '@/config/areas';
import { MaintenanceAreaDetailsModal } from '@/config/maintenance-area-details-config';
import { Filters, PagedQueryResult, Row, useTableQuery, useTableWithRelations } from '@/hooks/database';
import { useDelete } from '@/hooks/useDelete';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { Maintenance_areasInsertSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

export default function MaintenanceAreasPage() {
  const supabase = createClient();

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<MaintenanceAreaWithRelations | null>(null);

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === 'true';
    if (filters.areaType) f.area_type_id = filters.areaType;
    
    // THE FIX: Construct the 'or' filter as a string according to PostgREST syntax.
    if (debouncedSearchTerm) {
      f.or = `(name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%)`;
    }
    
    return f;
  }, [filters, debouncedSearchTerm]);

  const areasQuery = useTableWithRelations<'maintenance_areas', PagedQueryResult<MaintenanceAreaWithRelations>>(
    supabase, 'maintenance_areas',
    [ 'area_type:area_type_id(id, name)', 'parent_area:parent_id(id, name, code)', 'child_areas:maintenance_areas!parent_id(id, name, code, status)' ],
    { filters: serverFilters, orderBy: [{ column: 'name', ascending: true }] }
  );

  const { refetch, error, data } = areasQuery;
  const allAreas = useMemo(() => data?.data || [], [data]);
  const totalCount = data?.count || 0;
  const selectedEntity = useMemo(() => allAreas.find(a => a.id === selectedAreaId) || null, [allAreas, selectedAreaId]);
  
  const { data: areaTypesResult } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: { operator: 'eq', value: 'MAINTENANCE_AREA_TYPES' } },
    orderBy: [{ column: 'name', ascending: true }],
  });
  const areaTypes = useMemo(() => areaTypesResult?.data || [], [areaTypesResult]);

  const { createAreaMutation, updateAreaMutation, toggleStatusMutation, handleFormSubmit } = useMaintenanceAreasMutations(supabase, () => {
    refetch(); setFormOpen(false); setEditingArea(null);
  });

  const deleteManager = useDelete({ tableName: 'maintenance_areas',
    onSuccess: () => { if (selectedAreaId === deleteManager.itemToDelete?.id) { setSelectedAreaId(null); } refetch(); },
  });

  const handleOpenCreateForm = () => { setEditingArea(null); setFormOpen(true); };
  const handleOpenEditForm = (area: MaintenanceAreaWithRelations) => { setEditingArea(area); setFormOpen(true); };
  
  const headerActions = useStandardHeaderActions({
    data: allAreas as Row<'maintenance_areas'>[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: handleOpenCreateForm, isLoading: areasQuery.isLoading,
    exportConfig: { tableName: 'maintenance_areas' },
  });
  
  const headerStats = [
    { value: totalCount, label: 'Total Areas' },
    { value: allAreas.filter((r) => r.status).length, label: 'Active', color: 'success' as const },
    { value: allAreas.filter((r) => !r.status).length, label: 'Inactive', color: 'danger' as const },
  ];

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }
  
  const isLoading = areasQuery.isLoading || createAreaMutation.isPending || updateAreaMutation.isPending || toggleStatusMutation.isPending;

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900 min-h-screen">
      <PageHeader title="Maintenance Areas" description="Manage maintenance areas, zones, and terminals." icon={<FiMapPin />} stats={headerStats} actions={headerActions} isLoading={isLoading} className="mb-4" />
      
      <EntityManagementComponent<MaintenanceAreaWithRelations>
        config={areaConfig}
        entitiesQuery={areasQuery}
        toggleStatusMutation={{ mutate: toggleStatusMutation.mutate, isPending: toggleStatusMutation.isPending }}
        onEdit={() => handleOpenEditForm(selectedEntity!)}
        onDelete={deleteManager.deleteSingle}
        onCreateNew={handleOpenCreateForm}
        selectedEntityId={selectedAreaId}
        onSelect={setSelectedAreaId}
        onViewDetails={() => setIsDetailsModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={() => { setSearchTerm(''); setFilters({}); }}
      />

      {isFormOpen && (
        <AreaFormModal
          isOpen={isFormOpen} onClose={() => setFormOpen(false)}
          onSubmit={(data: Maintenance_areasInsertSchema) => handleFormSubmit(data, editingArea)}
          area={editingArea} allAreas={allAreas} areaTypes={areaTypes}
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