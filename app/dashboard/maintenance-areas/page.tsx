// components/maintenance-areas/MaintenanceAreasPage.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal';
import { AreaFormModal } from '@/components/maintenance-areas/AreaFormModal';
import { useMaintenanceAreasMutations } from '@/components/maintenance-areas/useMaintenanceAreasMutations';
import { areaConfig, MaintenanceAreaWithRelations } from '@/config/areas';
import {
  Filters,
  useTableQuery,
  useTableWithRelations,
} from '@/hooks/database';
import { useDelete } from '@/hooks/useDelete';
import { Maintenance_areasInsertSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { toast } from 'sonner';

export default function MaintenanceAreasPage() {
  const supabase = createClient();

  // State management
  const [filters, setFilters] = useState<{
    status?: string;
    areaType?: string;
  }>({});
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] =
    useState<MaintenanceAreaWithRelations | null>(null);

  // Data queries
  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === 'true';
    if (filters.areaType) f.area_type_id = filters.areaType;
    return f;
  }, [filters]);

  const areasQuery = useTableWithRelations(
    supabase,
    'maintenance_areas',
    [
      'area_type:area_type_id(id, name)',
      'parent_area:parent_id(id, name, code)',
      'child_areas:maintenance_areas!parent_id(id, name, code, status)'
    ],
    {
      filters: serverFilters,
      orderBy: [{ column: 'name', ascending: true }],
      select: (data) => {
        return data.map(item => ({
          ...item,
          area_type: item.area_type_id || null,
          parent_area: item.parent_id || null,
          child_areas: item.id || []
        })) as MaintenanceAreaWithRelations[];
      }
    }
  );

  const { isLoading, error, refetch } = areasQuery;

  const { data: areaTypes = [] } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: { operator: 'eq', value: 'MAINTENANCE_AREA_TYPES' } },
    orderBy: [{ column: 'name', ascending: true }],
  });

  // Data mutations
  const {
    createAreaMutation,
    updateAreaMutation,
    toggleStatusMutation,
    handleFormSubmit,
  } = useMaintenanceAreasMutations(supabase, () => {
    areasQuery.refetch();
    setFormOpen(false);
    setEditingArea(null);
  });

  const deleteManager = useDelete({
    tableName: 'maintenance_areas',
    onSuccess: () => {
      if (selectedAreaId === deleteManager.itemToDelete?.id) {
        setSelectedAreaId(null);
      }
      areasQuery.refetch();
    },
  });

  // Derived state
  const allAreas = useMemo(
    () => (areasQuery.data as MaintenanceAreaWithRelations[]) || [],
    [areasQuery.data]
  );
  const selectedArea = useMemo(
    () => allAreas.find((area) => area.id === selectedAreaId) || null,
    [selectedAreaId, allAreas]
  );

  // Event handlers
  const handleOpenCreateForm = () => {
    setEditingArea(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (area: MaintenanceAreaWithRelations) => {
    setEditingArea(area);
    setFormOpen(true);
  };

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    data: allAreas,
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    // onAddNew: handleOpenCreateForm,
    isLoading: areasQuery.isLoading,
    exportConfig: { tableName: 'maintenance_areas' },
  });

  const headerStats = [
    { value: allAreas.length, label: 'Total Areas' },
    {
      value: allAreas.filter((r) => r.status).length,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: allAreas.filter((r) => !r.status).length,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];

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
    <div className="p-4 md:p-6 dark:bg-gray-900 min-h-screen">
      <PageHeader
        title="Maintenance Areas"
        description="Manage maintenance areas, zones, and terminals."
        icon={<FiMapPin />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        className="mb-4"
      />
      <EntityManagementComponent<MaintenanceAreaWithRelations>
        config={areaConfig}
        entitiesQuery={areasQuery}
        toggleStatusMutation={{
          mutate: toggleStatusMutation.mutate,
          isPending: toggleStatusMutation.isPending,
          error: toggleStatusMutation.error,
          data: toggleStatusMutation.data
        }}
        onEdit={handleOpenEditForm}
        onDelete={deleteManager.deleteSingle}
        onCreateNew={handleOpenCreateForm}
      />

      {/* Modals */}
      {isFormOpen && (
        <AreaFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={(data: Maintenance_areasInsertSchema) =>
            handleFormSubmit(data, editingArea)
          }
          area={editingArea}
          allAreas={allAreas}
          areaTypes={areaTypes}
          isLoading={
            createAreaMutation.isPending || updateAreaMutation.isPending
          }
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size="md"
      />
    </div>
  );
}
