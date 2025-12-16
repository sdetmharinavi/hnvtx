// app/dashboard/ofc/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { BulkActions } from '@/components/common/BulkActions';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { OfcTableColumns } from '@/config/table-columns/OfcTableColumns';
import {
  Ofc_cablesRowSchema,
  V_ofc_cables_completeRowSchema,
  Lookup_typesRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import OfcForm from '@/components/ofc/OfcForm/OfcForm';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useUser } from '@/providers/UserProvider';
import { AiFillMerge } from 'react-icons/ai';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useOfcData } from '@/hooks/data/useOfcData';
import { TableAction } from '@/components/table';
import { Row } from '@/hooks/database';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { OfcCableCard } from '@/components/ofc/OfcCableCard';
import { UserRole } from '@/types/user-roles';

const OfcPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { isSuperAdmin, role } = useUser();

  const {
    data: ofcData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_cables', V_ofc_cables_completeRowSchema>({
    tableName: 'ofc_cables',
    dataQueryHook: useOfcData,
    displayNameField: 'route_name',
  });

  const isInitialLoad = isLoading && ofcData.length === 0;

  // --- PERMISSIONS ---
  // Only Asset Admins, Generic Admins, or Super Admins can edit physical infra
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN;
  // Strictly Super Admin for deletion
  const canDelete = !!isSuperAdmin;

  // Fetch Options
  const { data: ofcTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ofc-types-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'OFC_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'OFC_TYPES' }).toArray()
  );

  const { data: ofcOwnersData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ofc-owners-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'OFC_OWNER')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'OFC_OWNER' }).toArray()
  );

  const ofcTypes = useMemo(() => (ofcTypesData || []).filter(t => t.name !== 'DEFAULT'), [ofcTypesData]);
  const ofcOwners = useMemo(() => (ofcOwnersData || []).filter(o => o.name !== 'DEFAULT'), [ofcOwnersData]);

  // Table Config
  const columns = OfcTableColumns(ofcData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_cables_complete]);
  
  const tableActions = useMemo(
    () =>
      createStandardActions<V_ofc_cables_completeRowSchema>({
        // Conditionally pass edit handler
        onEdit: canEdit ? editModal.openEdit : undefined,
        onView: (record) => router.push(`/dashboard/ofc/${record.id}`),
        // Conditionally pass delete handler
        onDelete: canDelete ? crudActions.handleDelete : undefined,
      }) as TableAction<'v_ofc_cables_complete'>[],
    [editModal.openEdit, router, crudActions.handleDelete, canEdit, canDelete]
  );

  const headerActions = useStandardHeaderActions({
    data: ofcData as Ofc_cablesRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    // Conditionally show Add New
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    exportConfig: { tableName: 'ofc_cables' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total OFC Cables' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const renderMobileItem = useCallback((record: Row<'v_ofc_cables_complete'>) => {
    return (
        <OfcCableCard 
            cable={record as V_ofc_cables_completeRowSchema}
            onView={(r) => router.push(`/dashboard/ofc/${r.id}`)}
            onEdit={editModal.openEdit}
            onDelete={crudActions.handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    )
  }, [editModal.openEdit, crudActions.handleDelete, router, canEdit, canDelete]);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="OFC Cable Management"
        description="Manage OFC cables and their related information."
        icon={<AiFillMerge />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      
      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search route name, asset no..." 
                value={search.searchQuery} 
                onChange={(e) => search.setSearchQuery(e.target.value)}
                leftIcon={<FiSearch className="text-gray-400" />}
                fullWidth
                clearable
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[160px]">
                <SearchableSelect 
                   placeholder="Cable Type"
                   options={ofcTypes.map(t => ({ value: t.id, label: t.name }))}
                   value={filters.filters.ofc_type_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, ofc_type_id: v}))}
                   clearable
                />
             </div>
             <div className="min-w-[160px]">
                 <SearchableSelect 
                   placeholder="Owner"
                   options={ofcOwners.map(o => ({ value: o.id, label: o.name }))}
                   value={filters.filters.ofc_owner_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, ofc_owner_id: v}))}
                   clearable
                />
             </div>
             {/* View Toggle */}
             <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0">
                <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                   title="Grid View"
                >
                    <FiGrid />
                </button>
                <button 
                   onClick={() => setViewMode('table')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                   title="Table View"
                >
                    <FiList />
                </button>
             </div>
          </div>
      </div>

      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="ofc cable"
        showStatusUpdate={true}
        // THE FIX: Pass delete capability
        canDelete={() => canDelete}
      />
      
      {/* Content */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {ofcData.map(cable => (
                <OfcCableCard 
                    key={cable.id} 
                    cable={cable} 
                    onView={(r) => router.push(`/dashboard/ofc/${r.id}`)}
                    onEdit={editModal.openEdit}
                    onDelete={crudActions.handleDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
             ))}
             {ofcData.length === 0 && !isLoading && (
                 <div className="col-span-full py-16 text-center text-gray-500">
                    <AiFillMerge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No cables found matching your criteria.</p>
                 </div>
             )}
          </div>
      ) : (
           <DataTable
            autoHideEmptyColumns={true}
            tableName="v_ofc_cables_complete"
            data={ofcData}
            columns={orderedColumns}
            loading={isLoading}
            isFetching={isFetching || isMutating}
            actions={tableActions}
            // THE FIX: Selectable only if user can delete
            selectable={canDelete}
            onRowSelect={(rows) => {
                const validRows = rows.filter((row): row is V_ofc_cables_completeRowSchema & { id: string } => row.id != null);
                bulkActions.handleRowSelect(validRows);
            }}
            pagination={{
                current: pagination.currentPage,
                pageSize: pagination.pageLimit,
                total: totalCount,
                showSizeChanger: true,
                onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); },
            }}
            customToolbar={<></>}
            renderMobileItem={renderMobileItem}
          />
      )}

      <OfcForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        ofcCable={editModal.record as Ofc_cablesRowSchema}
        onSubmit={crudActions.handleSave}
        pageLoading={isMutating}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default OfcPage;