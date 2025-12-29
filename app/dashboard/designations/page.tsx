// app/dashboard/designations/page.tsx
'use client';

import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header/PageHeader';
import { useStandardHeaderActions } from '@/components/common/page-header/hooks/useStandardHeaderActions';
import { DesignationFormModal } from '@/components/designations/DesignationFormModal';
import { designationConfig, DesignationWithRelations } from '@/config/designations';
import {
  Filters,
  PagedQueryResult,
  Row,
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
} from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import {
  Employee_designationsInsertSchema,
  Employee_designationsUpdateSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { ImUserTie } from 'react-icons/im';
import { toast } from 'sonner';
import { useCrudManager } from '@/hooks/useCrudManager';
import { UseQueryResult } from '@tanstack/react-query';
import { useDesignationsData } from '@/hooks/data/useDesignationsData';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { Copy } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';

export default function DesignationManagerPage() {
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  const [selectedDesignationId, setSelectedDesignationId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithRelations | null>(
    null
  );

  const {
    data: allDesignations,
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
  } = useCrudManager<'employee_designations', DesignationWithRelations>({
    tableName: 'employee_designations',
    dataQueryHook: useDesignationsData,
    displayNameField: 'name',
    searchColumn: 'name',
  });

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    allDesignations,
    'name',
    'Designations'
  );

  // --- PERMISSIONS ---
  // Admins can Create/Edit
  const canEdit = isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;
  // Only Super Admin can Delete
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const isInitialLoad = isLoading && allDesignations.length === 0;

  const onMutationSuccess = () => {
    refetch();
    setFormOpen(false);
    setEditingDesignation(null);
  };

  const createDesignationMutation = useTableInsert(supabase, 'employee_designations', {
    onSuccess: onMutationSuccess,
  });
  const updateDesignationMutation = useTableUpdate(supabase, 'employee_designations', {
    onSuccess: onMutationSuccess,
  });

  // Explicitly type the mutation hook
  const toggleStatusMutation = useToggleStatus(supabase, 'employee_designations', {
    onSuccess: onMutationSuccess,
  }) as unknown as {
    mutate: (variables: {
      id: string;
      status: boolean;
      nameField?: keyof DesignationWithRelations;
    }) => void;
    isPending: boolean;
  };

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

  const handleFormSubmit = (data: Employee_designationsInsertSchema) => {
    if (editingDesignation) {
      updateDesignationMutation.mutate({
        id: editingDesignation.id || '',
        data: data as Employee_designationsUpdateSchema,
      });
    } else {
      createDesignationMutation.mutate(data);
    }
  };

  const headerActions = useStandardHeaderActions({
    data: allDesignations as Row<'employee_designations'>[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    // Only allow adding new items if user has edit permission
    onAddNew: canEdit ? handleOpenCreateForm : undefined,
    isLoading: isLoading,
    exportConfig: canEdit ? { tableName: 'employee_designations' } : undefined,
  });

  headerActions.splice(headerActions.length - 1, 0, {
    label: showDuplicates ? 'Hide Duplicates' : 'Find Duplicates',
    onClick: toggleDuplicates,
    variant: showDuplicates ? 'secondary' : 'outline',
    leftIcon: <Copy className="w-4 h-4" />,
    hideTextOnMobile: true,
  });

  const headerStats = [
    { value: totalCount, label: 'Total Designations' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error && isInitialLoad) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );
  }

  const designationsQuery: UseQueryResult<PagedQueryResult<DesignationWithRelations>, Error> = {
    data: { data: allDesignations, count: totalCount },
    isLoading,
    isFetching,
    error,
    isError: !!error,
    refetch,
  } as UseQueryResult<PagedQueryResult<DesignationWithRelations>, Error>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden p-4 md:p-6">
      <PageHeader
        title="Designation Management"
        description="Manage designations and their related information."
        icon={<ImUserTie />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
        className="mb-4"
      />
      <EntityManagementComponent<DesignationWithRelations>
        config={designationConfig}
        entitiesQuery={designationsQuery}
        isFetching={isFetching || isMutating}
        toggleStatusMutation={toggleStatusMutation}
        onEdit={canEdit ? handleOpenEditForm : () => {}}
        // THE FIX: Pass delete handler only if user can delete
        onDelete={canDelete ? deleteManager.deleteSingle : undefined}
        onCreateNew={canEdit ? handleOpenCreateForm : () => {}}
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
        duplicateSet={duplicateSet}
      />

      {isFormOpen && (
        <DesignationFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          designation={editingDesignation}
          allDesignations={allDesignations.map((d) => ({
            id: d.id ?? '',
            name: d.name,
            created_at: d.created_at ?? null,
            updated_at: d.updated_at ?? null,
            parent_id: d.parent_id ?? null,
            status: d.status ?? null,
          }))}
          isLoading={createDesignationMutation.isPending || updateDesignationMutation.isPending}
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
        loading={deleteManager.isPending}
      />
    </div>
  );
}
