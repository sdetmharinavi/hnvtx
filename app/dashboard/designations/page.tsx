// app/dashboard/designations/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { EntityManagementComponent } from '@/components/common/entity-management/EntityManagementComponent';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import { PageHeader } from '@/components/common/page-header/PageHeader';
import { useStandardHeaderActions } from '@/components/common/page-header/hooks/useStandardHeaderActions';
import { designationConfig, DesignationWithRelations } from '@/config/designations';
import { Filters, Row, useTableInsert, useTableUpdate, useToggleStatus } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import {
  Employee_designationsInsertSchema,
  Employee_designationsUpdateSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { ImUserTie } from 'react-icons/im';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useDesignationsData } from '@/hooks/data/useDesignationsData';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { Copy } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
// THE FIX: Import the dropdown hook
import { useDropdownOptions } from '@/hooks/data/useDropdownOptions';

const DesignationFormModal = dynamic(
  () =>
    import('@/components/designations/DesignationFormModal').then(
      (mod) => mod.DesignationFormModal
    ),
  { loading: () => <PageSpinner text="Loading Form..." /> }
);

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
    queryResult,
  } = useCrudManager<'employee_designations', DesignationWithRelations>({
    tableName: 'employee_designations',
    dataQueryHook: useDesignationsData,
    displayNameField: 'name',
    searchColumn: 'name',
    syncTables: ['employee_designations', 'v_employee_designations'],
  });

  // THE FIX: Fetch full list for dropdowns (limit 10,000)
  const { options: parentOptions, isLoading: isLoadingParents } = useDropdownOptions({
    tableName: 'employee_designations',
    valueField: 'id',
    labelField: 'name',
    // We want all designations, even inactive ones might be parents historically,
    // but usually only active ones should be selected. Let's show all for hierarchy completeness.
    orderBy: 'name',
    orderDir: 'asc',
  });

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    allDesignations,
    'name',
    'Designations'
  );

  const canEdit = isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;
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
    },
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
        entitiesQuery={queryResult}
        isFetching={isFetching || isMutating}
        toggleStatusMutation={toggleStatusMutation}
        onEdit={canEdit ? handleOpenEditForm : () => {}}
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
          // THE FIX: Pass parentOptions instead of allDesignations
          // We convert Option[] back to simple array of objects for the modal to process, or update modal to accept options directly.
          // Since the modal expects Employee_designationsRowSchema[], we map:
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
