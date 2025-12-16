// app/dashboard/nodes/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { NodeFormModal } from '@/components/nodes/NodeFormModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { NodeDetailsModal } from '@/config/node-details-config';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import { Row } from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { NodesRowSchema, V_nodes_completeRowSchema, Lookup_typesRowSchema, Maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo, useState } from 'react';
import { FiCpu, FiCopy, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { toast } from 'sonner';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useNodesData } from '@/hooks/data/useNodesData';
import { useUser } from '@/providers/UserProvider';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { NodeCard } from '@/components/nodes/NodeCard';
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { BulkActions } from '@/components/common/BulkActions';
import { UserRole } from '@/types/user-roles';

export type NodeRowsWithRelations = NodesRowSchema & {
  maintenance_terminal?: { id: string; name: string } | null;
  node_type?: { id: string; name: string } | null;
};

const NodesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { isSuperAdmin, role } = useUser();
  const supabase = createClient();

  const {
    data: nodes,
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
    viewModal,
    deleteModal,
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'nodes', V_nodes_completeRowSchema>({
    tableName: 'nodes',
    dataQueryHook: useNodesData,
    displayNameField: 'name'
  });

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(nodes, 'name', 'Nodes');

  // --- PERMISSIONS ---
  const canEdit = isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN;
  // THE FIX: Strict delete permission
  const canDelete = !!isSuperAdmin;

  // 1. Fetch Node Types
  const { data: nodeTypeOptionsData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['node-types-filter'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'NODE_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'NODE_TYPES' }).toArray()
  );

  // 2. Fetch Maintenance Areas
  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['maintenance-areas-for-filter-nodes'],
    async () => (await supabase.from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );

  // Options Mappers
  const nodeTypeOptions = useMemo(() => 
    (nodeTypeOptionsData || [])
      .filter(t => t.name !== 'DEFAULT')
      .map(t => ({ value: t.id, label: t.name })), 
  [nodeTypeOptionsData]);

  const areaOptions = useMemo(() => 
    (maintenanceAreasData || []).map(m => ({ value: m.id, label: m.name })), 
  [maintenanceAreasData]);

  const isInitialLoad = isLoading && nodes.length === 0;

  const columns = NodesTableColumns(nodes, showDuplicates ? duplicateSet : undefined);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_nodes_complete]);

  const tableActions = useMemo(
    () =>
      createStandardActions<V_nodes_completeRowSchema>({
        onEdit: canEdit ? editModal.openEdit : undefined,
        onView: viewModal.open,
        // THE FIX: Conditionally pass delete action
        onDelete: canDelete ? crudActions.handleDelete : undefined,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete, canEdit, canDelete]
  );

  const headerActions = useStandardHeaderActions({
    data: nodes as NodesRowSchema[],
    onAddNew: canEdit ? editModal.openAdd : undefined,
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    isLoading: isLoading,
    exportConfig: { tableName: 'nodes' },
  });

  headerActions.splice(headerActions.length - 1, 0, {
    label: showDuplicates ? "Hide Duplicates" : "Find Duplicates",
    onClick: toggleDuplicates,
    variant: showDuplicates ? "secondary" : "outline",
    leftIcon: <FiCopy />,
    hideTextOnMobile: true
  });

  const headerStats = [
    { value: totalCount, label: 'Total Nodes' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const renderMobileItem = useCallback((record: Row<'v_nodes_complete'>) => {
      return (
         <NodeCard 
            node={record as V_nodes_completeRowSchema}
            onEdit={editModal.openEdit}
            onDelete={crudActions.handleDelete}
            onView={viewModal.open}
            canEdit={canEdit}
            canDelete={canDelete} 
         />
      )
  }, [editModal.openEdit, crudActions.handleDelete, viewModal.open, canEdit, canDelete]);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="Node Management"
        description="Manage network locations, towers, and exchanges."
        icon={<FiCpu />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />

      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search node name, remark..." 
                value={search.searchQuery} 
                onChange={(e) => search.setSearchQuery(e.target.value)}
                leftIcon={<FiSearch className="text-gray-400" />}
                fullWidth
                clearable
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[180px]">
                <SearchableSelect 
                   placeholder="Node Type"
                   options={nodeTypeOptions}
                   value={filters.filters.node_type_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, node_type_id: v}))}
                   clearable
                />
             </div>
             <div className="min-w-[180px]">
                 <SearchableSelect 
                   placeholder="Maintenance Area"
                   options={areaOptions}
                   value={filters.filters.maintenance_terminal_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, maintenance_terminal_id: v}))}
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
        entityName="node"
        showStatusUpdate={true}
        // THE FIX: Pass delete capability to BulkActions
        canDelete={() => canDelete}
      />

      {/* Content Area */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {nodes.map(node => (
                <NodeCard 
                    key={node.id} 
                    node={node} 
                    onEdit={editModal.openEdit} 
                    onDelete={crudActions.handleDelete} 
                    onView={viewModal.open}
                    canEdit={canEdit}
                    canDelete={canDelete} 
                />
             ))}
             {nodes.length === 0 && !isLoading && (
                 <div className="col-span-full py-16 text-center text-gray-500">
                    <FiCpu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No nodes found matching your criteria.</p>
                 </div>
             )}
          </div>
      ) : (
           <DataTable
            autoHideEmptyColumns={true}
            tableName="v_nodes_complete"
            data={nodes}
            columns={orderedColumns}
            loading={isLoading}
            actions={tableActions}
            // THE FIX: Selectable only if user can delete (or perform other bulk actions if we add them later)
            selectable={canDelete}
            onRowSelect={(rows) => {
                const validRows = rows.filter((row): row is V_nodes_completeRowSchema & { id: string } => row.id != null);
                bulkActions.handleRowSelect(validRows);
            }}
            showColumnsToggle={true}
            searchable={false} // Custom toolbar used
            onCellEdit={crudActions.handleCellEdit}
            renderMobileItem={renderMobileItem}
            pagination={{
                current: pagination.currentPage,
                pageSize: pagination.pageLimit,
                total: totalCount,
                showSizeChanger: true,
                onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); },
            }}
            customToolbar={<></>}
          />
      )}

      {editModal.isOpen && (
        <NodeFormModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          editingNode={editModal.record as NodeRowsWithRelations | null}
          onSubmit={crudActions.handleSave}
          isLoading={isMutating}
        />
      )}
      
      <NodeDetailsModal
        isOpen={viewModal.isOpen}
        node={viewModal.record as V_nodes_completeRowSchema}
        onClose={viewModal.close}
      />
      
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
};

export default NodesPage;