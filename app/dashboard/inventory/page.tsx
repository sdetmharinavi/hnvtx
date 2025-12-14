// app/dashboard/inventory/page.tsx
"use client";

import { useMemo, useState, useRef } from "react";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { DataTable, TableAction } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { FiArchive, FiMinusCircle, FiClock, FiUpload, FiGrid, FiList, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { Row } from "@/hooks/database";
import { V_inventory_itemsRowSchema, Inventory_itemsInsertSchema, Lookup_typesRowSchema, V_nodes_completeRowSchema } from "@/schemas/zod-schemas";
import { createStandardActions } from "@/components/table/action-helpers";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { getInventoryTableColumns } from "@/config/table-columns/InventoryTableColumns";
import { FaQrcode } from "react-icons/fa";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { useInventoryData } from "@/hooks/data/useInventoryData";
import { IssueItemModal } from "@/components/inventory/IssueItemModal";
import { InventoryHistoryModal } from "@/components/inventory/InventoryHistoryModal";
import { IssueItemFormData, useIssueInventoryItem } from "@/hooks/inventory-actions";
import { useInventoryExcelUpload } from "@/hooks/database/excel-queries/useInventoryExcelUpload";
import { formatCurrency } from "@/utils/formatters";
import { InventoryItemCard } from "@/components/inventory/InventoryItemCard";
import { Input, SearchableSelect } from "@/components/common/ui";
import { BulkActions } from "@/components/common/BulkActions";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { createClient } from "@/utils/supabase/client";
import { localDb } from "@/hooks/data/localDb";
import { UserRole } from "@/types/user-roles";

export default function InventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { role, isSuperAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [itemToIssue, setItemToIssue] = useState<V_inventory_itemsRowSchema | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<{id: string, name: string} | null>(null);

  const {
    data: inventory, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions, filters, bulkActions
  } = useCrudManager<'inventory_items', V_inventory_itemsRowSchema>({
    tableName: 'inventory_items',
    dataQueryHook: useInventoryData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'asset_no'],
  });

  const { mutate: issueItem, isPending: isIssuing } = useIssueInventoryItem();
  const { mutate: uploadInventory, isPending: isUploading } = useInventoryExcelUpload();

  // --- Fetch Filter Options ---
  const { data: categories } = useOfflineQuery<Lookup_typesRowSchema[]>(
     ['inventory-categories'],
     async () => (await supabase.from('lookup_types').select('*').eq('category', 'INVENTORY_CATEGORY')).data ?? [],
     async () => await localDb.lookup_types.where({ category: 'INVENTORY_CATEGORY' }).toArray()
  );
  
  const { data: locations } = useOfflineQuery<V_nodes_completeRowSchema[]>(
     ['inventory-locations'],
     async () => (await supabase.from('v_nodes_complete').select('*').eq('status', true)).data ?? [],
     async () => await localDb.v_nodes_complete.where({ status: true }).toArray()
  );

  const categoryOptions = useMemo(() => (categories || []).map(c => ({ value: c.id, label: c.name })), [categories]);
  const locationOptions = useMemo(() => (locations || []).map(l => ({ value: l.id!, label: l.name! })), [locations]);

  // Permission Logic
  const canEdit = useMemo(() => !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN, [isSuperAdmin, role]);
  const canDelete = !!isSuperAdmin;

  // Calculate Total Value of visible items
  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.total_value || 0), 0);
  }, [inventory]);

  const handleOpenIssueModal = (record: V_inventory_itemsRowSchema) => {
    setItemToIssue(record);
    setIsIssueModalOpen(true);
  };

  const handleOpenHistory = (record: V_inventory_itemsRowSchema) => {
      if (!record.id) return;
      setHistoryItem({ id: record.id, name: record.name || 'Item' });
      setIsHistoryModalOpen(true);
  };

  const handleIssueSubmit = (data: IssueItemFormData) => {
    issueItem(data, {
      onSuccess: () => { refetch(); setIsIssueModalOpen(false); setItemToIssue(null); }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadInventory({ file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Table Config
  const columns = getInventoryTableColumns();
  const tableActions = useMemo((): TableAction<'v_inventory_items'>[] => {
    const standardActions = createStandardActions<V_inventory_itemsRowSchema>({
      onEdit: canEdit ? editModal.openEdit : undefined,
      onDelete: canDelete ? crudActions.handleDelete : undefined,
    });
    standardActions.unshift({
        key: 'history', label: 'History', icon: <FiClock />, onClick: (r) => handleOpenHistory(r), variant: 'secondary'
    });
    if (canEdit) {
        standardActions.unshift({
          key: 'issue', label: 'Issue', icon: <FiMinusCircle className="text-orange-600" />, onClick: (r) => handleOpenIssueModal(r), variant: 'secondary', disabled: (r) => (r.quantity || 0) <= 0,
        });
    }
    standardActions.unshift({
      key: 'qr-code', label: 'QR', icon: <FaQrcode />, onClick: (r) => router.push(`/dashboard/inventory/qr/${r.id}`), variant: 'secondary'
    });
    return standardActions;
  }, [editModal.openEdit, crudActions.handleDelete, canEdit, canDelete, router]);

  const headerActions = useStandardHeaderActions<'v_inventory_items'>({
    data: inventory as Row<'v_inventory_items'>[],
    onRefresh: async () => { await refetch(); toast.success('Inventory refreshed!'); },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading,
    exportConfig: { tableName: 'v_inventory_items', useRpc: true }
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
        label: isUploading ? 'Importing...' : 'Import', variant: 'outline', leftIcon: <FiUpload />, disabled: isUploading || isLoading, onClick: () => fileInputRef.current?.click(), hideTextOnMobile: true
    });
  }

  const headerStats = [
      { value: totalCount, label: 'Total Items' },
      { value: formatCurrency(totalInventoryValue), label: 'Total Value', color: 'success' as const }
  ];

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />

      <PageHeader
        title="Inventory"
        description="Track physical assets, stock levels, and movements."
        icon={<FiArchive />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      {/* Sticky Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
          <div className="w-full lg:w-96">
            <Input 
                placeholder="Search asset, name, desc..." 
                value={search.searchQuery} 
                onChange={(e) => search.setSearchQuery(e.target.value)}
                leftIcon={<FiSearch className="text-gray-400" />}
                fullWidth
            />
          </div>
          
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="min-w-[160px]">
                <SearchableSelect 
                   placeholder="Category"
                   options={categoryOptions}
                   value={filters.filters.category_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, category_id: v}))}
                   clearable
                />
             </div>
             <div className="min-w-[160px]">
                 <SearchableSelect 
                   placeholder="Location"
                   options={locationOptions}
                   value={filters.filters.location_id as string}
                   onChange={(v) => filters.setFilters(prev => ({...prev, location_id: v}))}
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
        onBulkUpdateStatus={() => {}} 
        onClearSelection={bulkActions.handleClearSelection}
        entityName="item"
        showStatusUpdate={false}
        canDelete={() => canDelete}
      />

      {/* Content Area */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {inventory.map(item => (
                <InventoryItemCard 
                    key={item.id}
                    item={item}
                    onEdit={editModal.openEdit}
                    onDelete={crudActions.handleDelete}
                    onIssue={handleOpenIssueModal}
                    onHistory={handleOpenHistory}
                    onQr={(r) => router.push(`/dashboard/inventory/qr/${r.id}`)}
                    canManage={canEdit}
                    canDelete={canDelete}
                />
             ))}
             {inventory.length === 0 && !isLoading && (
                 <div className="col-span-full py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <FiArchive className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                 </div>
             )}
          </div>
      ) : (
           <DataTable
            autoHideEmptyColumns={true}
            tableName="v_inventory_items"
            data={inventory}
            columns={columns}
            loading={isLoading}
            isFetching={isFetching || isMutating}
            actions={tableActions}
            selectable={canDelete} // Only selectable if can delete
            onRowSelect={(rows) => {
                const validRows = rows.filter((row): row is V_inventory_itemsRowSchema & { id: string } => row.id != null);
                bulkActions.handleRowSelect(validRows);
            }}
            pagination={{
                current: pagination.currentPage,
                pageSize: pagination.pageLimit,
                total: totalCount,
                showSizeChanger: true,
                onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); }
            }}
            customToolbar={<></>}
          />
      )}

      {/* Modals */}
      <InventoryFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingItem={editModal.record as V_inventory_itemsRowSchema | null}
        onSubmit={crudActions.handleSave as (data: Inventory_itemsInsertSchema) => void}
        isLoading={isMutating}
      />

      {isIssueModalOpen && (
        <IssueItemModal
            isOpen={isIssueModalOpen}
            onClose={() => setIsIssueModalOpen(false)}
            item={itemToIssue}
            onSubmit={handleIssueSubmit}
            isLoading={isIssuing}
        />
      )}

      {isHistoryModalOpen && historyItem && (
          <InventoryHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            itemId={historyItem.id}
            itemName={historyItem.name}
          />
      )}

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
}