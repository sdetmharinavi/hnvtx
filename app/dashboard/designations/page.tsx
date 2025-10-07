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
  useTableWithRelations,
  useToggleStatus,
} from '@/hooks/database';
import { useDelete } from '@/hooks/useDelete';
import {
  Employee_designationsInsertSchema,
  Employee_designationsUpdateSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState } from 'react';
import { ImUserTie } from 'react-icons/im';
import { toast } from 'sonner';

export default function DesignationManagerPage() {
  const supabase = createClient();

  const [filters, setFilters] = useState<{ status?: string }>({});
  const [selectedDesignationId, setSelectedDesignationId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithRelations | null>(null);
  
  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === 'true';
    return f;
  }, [filters]);

  const designationsQuery = useTableWithRelations<
    'employee_designations',
    PagedQueryResult<DesignationWithRelations>
  >(
    supabase,
    'employee_designations',
    ['parent_designation:parent_id(id, name)'],
    {
      filters: serverFilters,
      orderBy: [{ column: 'name', ascending: true }],
    }
  );

  const { refetch, error, data } = designationsQuery;
  
  const allDesignations = useMemo(() => data?.data || [], [data]);
  const totalCount = data?.count || 0;

  const onMutationSuccess = () => {
    refetch();
    setFormOpen(false);
    setEditingDesignation(null);
  };

  const createDesignationMutation = useTableInsert(supabase, 'employee_designations', { onSuccess: onMutationSuccess });
  const updateDesignationMutation = useTableUpdate(supabase, 'employee_designations', { onSuccess: onMutationSuccess });
  const toggleStatusMutation = useToggleStatus(supabase, 'employee_designations', { onSuccess: onMutationSuccess }) as unknown as {
    mutate: (variables: { id: string; status: boolean; nameField?: string }) => void;
    isPending: boolean;
  };
  
  const toggleStatus = (variables: { id: string; status: boolean; nameField?: string }) => {
    return toggleStatusMutation.mutate({ ...variables, nameField: 'status' });
  };
  
  const { isPending } = toggleStatusMutation;

  const deleteManager = useDelete({
    tableName: 'employee_designations',
    onSuccess: () => {
      if (selectedDesignationId === deleteManager.itemToDelete?.id) {
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
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: handleOpenCreateForm,
    isLoading: designationsQuery.isLoading,
    exportConfig: { tableName: 'employee_designations' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Designations' },
    { value: allDesignations.filter((r) => r.status).length, label: 'Active', color: 'success' as const },
    { value: allDesignations.filter((r) => !r.status).length, label: 'Inactive', color: 'danger' as const },
  ];

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }

  const isLoading = designationsQuery.isLoading || createDesignationMutation.isPending || updateDesignationMutation.isPending || toggleStatusMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden p-4 md:p-6">
      <PageHeader
        title="Designation Management"
        description="Manage designations and their related information."
        icon={<ImUserTie />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        className="mb-4"
      />
      <EntityManagementComponent<DesignationWithRelations>
        config={designationConfig}
        entitiesQuery={designationsQuery}
        toggleStatusMutation={{ mutate: toggleStatus, isPending }}
        onEdit={handleOpenEditForm}
        onDelete={deleteManager.deleteSingle}
        onCreateNew={handleOpenCreateForm}
        selectedEntityId={selectedDesignationId}
        onSelect={setSelectedDesignationId}
      />

      {isFormOpen && (
        <DesignationFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          designation={editingDesignation}
          allDesignations={allDesignations.map((d) => ({
            id: d.id ?? '', name: d.name, created_at: d.created_at ?? null, updated_at: d.updated_at ?? null,
            parent_id: d.parent_id ?? null, status: d.status ?? null,
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