// app/dashboard/designations/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import dynamic from 'next/dynamic';
import { useDesignationsMutations } from '@/components/designations/useDesignationsMutations';
import { designationConfig, DesignationWithRelations } from '@/config/designations';
import { Filters, Row } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { ImUserTie } from 'react-icons/im';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useDesignationsData } from '@/hooks/data/useDesignationsData';
import { useUser } from '@/providers/UserProvider';
import { useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added

const DesignationFormModal = dynamic(
  () =>
    import('@/components/designations/DesignationFormModal').then(
      (mod) => mod.DesignationFormModal,
    ),
  { loading: () => <PageSpinner text='Loading Form...' /> },
);

export default function DesignationManagerPage() {
  const supabase = createClient();

  const [selectedDesignationId, setSelectedDesignationId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithRelations | null>(
    null,
  );

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
    displayNameField: 'name',
    searchColumn: 'name',
    syncTables: ['employee_designations', 'v_employee_designations'],
  });

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const { options: parentOptions, isLoading: isLoadingParents } = useDropdownOptions({
    tableName: 'employee_designations',
    valueField: 'id',
    labelField: 'name',
    orderBy: 'name',
    orderDir: 'asc',
  });

  const isInitialLoad = isLoading && allDesignations.length === 0;

  const {
    createDesignationMutation,
    updateDesignationMutation,
    toggleStatusMutation,
    handleFormSubmit,
  } = useDesignationsMutations(supabase, () => {
    refetch();
    setFormOpen(false);
    setEditingDesignation(null);
  });

  const deleteManager = useDeleteManager({
    tableName: 'employee_designations',
    onSuccess: () => {
      if (selectedDesignationId && deleteManager.itemToDelete?.id === selectedDesignationId) {
        setSelectedDesignationId(null);
      }
      refetch();
    },
  });

  const handleOpenCreateForm = () => {
    setEditingDesignation(null);
    setFormOpen(true);
  };
  const handleOpenEditForm = (designation: DesignationWithRelations) => {
    setEditingDesignation(designation);
    setFormOpen(true);
  };

  const headerActions = useStandardHeaderActions({
    data: allDesignations as Row<'employee_designations'>[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canEdit ? handleOpenCreateForm : undefined,
    isLoading: isLoading,
    exportConfig: canEdit ? { tableName: 'employee_designations' } : undefined,
  });

  // --- INTERACTIVE STATS ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

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
        title='Designation Management'
        description='Manage designations and their related information.'
        icon={<ImUserTie />}
        stats={headerStats} // Interactive Stats
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className='mb-4'
      />

      <EntityManagementComponent<DesignationWithRelations>
        config={designationConfig}
        entitiesQuery={queryResult}
        isFetching={isFetching || toggleStatusMutation.isPending}
        toggleStatusMutation={{
          mutate: toggleStatusMutation.mutate,
          isPending: toggleStatusMutation.isPending,
        }}
        onEdit={canEdit ? handleOpenEditForm : undefined}
        onDelete={canDelete ? deleteManager.deleteSingle : undefined}
        onCreateNew={canEdit ? handleOpenCreateForm : undefined}
        selectedEntityId={selectedDesignationId}
        onSelect={setSelectedDesignationId}
        onViewDetails={undefined}
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
        <DesignationFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          designation={editingDesignation}
          allDesignations={parentOptions.map((opt) => ({
            id: opt.value,
            name: opt.label,
            parent_id: null,
            status: true,
            created_at: null,
            updated_at: null,
          }))}
          isLoading={
            createDesignationMutation.isPending ||
            updateDesignationMutation.isPending ||
            isLoadingParents
          }
        />
      )}
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
