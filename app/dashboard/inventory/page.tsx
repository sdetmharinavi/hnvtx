// app/dashboard/inventory/page.tsx
"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { DataTable, TableAction } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { FiArchive, FiMinusCircle, FiClock, FiUpload, FiBox, FiMapPin } from "react-icons/fi"; 
import { toast } from "sonner";
import { Row } from "@/hooks/database";
import { V_inventory_itemsRowSchema, Inventory_itemsInsertSchema } from "@/schemas/zod-schemas";
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

// Use the new Transactional Import hook
import { useInventoryExcelUpload } from "@/hooks/database/excel-queries/useInventoryExcelUpload";
import { formatCurrency } from "@/utils/formatters";

export default function InventoryPage() {
  const router = useRouter();
  const { role, isSuperAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [itemToIssue, setItemToIssue] = useState<V_inventory_itemsRowSchema | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<{id: string, name: string} | null>(null);

  const {
    data: inventory, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'inventory_items', V_inventory_itemsRowSchema>({
    tableName: 'inventory_items',
    dataQueryHook: useInventoryData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'asset_no'],
  });

  const { mutate: issueItem, isPending: isIssuing } = useIssueInventoryItem();
  
  // NEW: Transactional Upload Hook
  const { mutate: uploadInventory, isPending: isUploading } = useInventoryExcelUpload();

  const columns = getInventoryTableColumns();
  const canPerformActions = useMemo(() => isSuperAdmin || role === 'admin' || role === 'asset_admin', [isSuperAdmin, role]);

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
      onSuccess: () => {
        refetch(); 
        setIsIssueModalOpen(false);
        setItemToIssue(null);
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadInventory({ file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tableActions = useMemo((): TableAction<'v_inventory_items'>[] => {
    const standardActions = createStandardActions<V_inventory_itemsRowSchema>({
      onEdit: canPerformActions ? editModal.openEdit : undefined,
      onDelete: canPerformActions ? crudActions.handleDelete : undefined,
    });
    
    standardActions.unshift({
        key: 'history',
        label: 'View History',
        icon: <FiClock />,
        onClick: (record) => handleOpenHistory(record),
        variant: 'secondary'
    });

    if (canPerformActions) {
        standardActions.unshift({
          key: 'issue',
          label: 'Issue Stock',
          icon: <FiMinusCircle className="text-orange-600" />,
          onClick: (record) => handleOpenIssueModal(record),
          variant: 'secondary',
          disabled: (record) => (record.quantity || 0) <= 0,
        });
    }

    standardActions.unshift({
      key: 'qr-code',
      label: 'View QR Code',
      icon: <FaQrcode />,
      onClick: (record) => router.push(`/dashboard/inventory/qr/${record.id}`),
      variant: 'secondary'
    });

    return standardActions;
  }, [editModal.openEdit, crudActions.handleDelete, canPerformActions, router]);

  const headerActions = useStandardHeaderActions<'v_inventory_items'>({
    data: inventory as Row<'v_inventory_items'>[],
    onRefresh: async () => { await refetch(); toast.success('Inventory refreshed!'); },
    onAddNew: canPerformActions ? editModal.openAdd : undefined,
    isLoading,
    exportConfig: { 
        tableName: 'v_inventory_items',
        useRpc: true 
    }
  });

  // Inject Upload Button
  if (canPerformActions) {
    headerActions.splice(1, 0, {
        label: isUploading ? 'Importing...' : 'Import Stock',
        variant: 'outline',
        leftIcon: <FiUpload />,
        disabled: isUploading || isLoading,
        onClick: () => fileInputRef.current?.click()
    });
  }

  const renderMobileItem = useCallback((record: Row<'v_inventory_items'>, actions: React.ReactNode) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
              {record.name}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
               {record.asset_no || 'No Asset ID'}
            </div>
          </div>
          {actions}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
           <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
               <div className="text-[10px] text-gray-400 uppercase">Quantity</div>
               <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                   <FiBox className="w-3 h-3" /> {record.quantity}
               </div>
           </div>
           <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
               <div className="text-[10px] text-gray-400 uppercase">Value</div>
               <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                   {formatCurrency(record.total_value || 0)}
               </div>
           </div>
        </div>

        <div className="space-y-1 mt-1">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <FiMapPin className="w-3 h-3 text-blue-500" />
                <span className="truncate">{record.store_location || 'Unknown Location'}</span>
            </div>
            {record.functional_location && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 pl-5">
                    └ {record.functional_location}
                </div>
            )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
             <span className="text-[10px] text-gray-400">{record.category_name}</span>
             <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                record.status_name === 'Working' || record.status_name === 'Good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                record.status_name === 'Faulty' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
             }`}>
                {record.status_name || 'Unknown'}
             </span>
        </div>
      </div>
    );
  }, []);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleFileChange} 
         className="hidden" 
         accept=".xlsx, .xls" 
      />

      <PageHeader
        title="Inventory Management"
        description="Track and manage all physical assets like equipment, furniture, and consumables."
        icon={<FiArchive />}
        stats={[{ value: totalCount, label: 'Total Items' }]}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />
      
      <DataTable
        tableName="v_inventory_items"
        data={inventory}
        columns={columns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        renderMobileItem={renderMobileItem}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            if (page !== pagination.currentPage) pagination.setCurrentPage(page);
            if (pageSize !== pagination.pageLimit) pagination.setPageLimit(pageSize);
          },
        }}
        searchable
        onSearchChange={search.setSearchQuery}
      />

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