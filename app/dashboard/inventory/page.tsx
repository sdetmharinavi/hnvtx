// app/dashboard/inventory/page.tsx
"use client";

import { useMemo } from "react";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { DataTable, TableAction } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { FiArchive} from "react-icons/fi";
import { toast } from "sonner";
import { Row } from "@/hooks/database";
import { V_inventory_itemsRowSchema, Inventory_itemsInsertSchema } from "@/schemas/zod-schemas";
import { createStandardActions } from "@/components/table/action-helpers";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { getInventoryTableColumns } from "@/components/inventory/InventoryTableColumns";
import { FaQrcode } from "react-icons/fa";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { useInventoryData } from "@/hooks/data/useInventoryData";

export default function InventoryPage() {
  const router = useRouter();
  const { role, isSuperAdmin } = useUser();
  const {
    data: inventory, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'inventory_items', V_inventory_itemsRowSchema>({
    tableName: 'inventory_items',
    dataQueryHook: useInventoryData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'asset_no'],
  });

  const columns = getInventoryTableColumns();
  
  const canPerformActions = useMemo(() => isSuperAdmin || role === 'admin' || role === 'asset_admin', [isSuperAdmin, role]);

  const tableActions = useMemo((): TableAction<'v_inventory_items'>[] => {
    const standardActions = createStandardActions<V_inventory_itemsRowSchema>({
      onEdit: canPerformActions ? editModal.openEdit : undefined,
      onDelete: canPerformActions ? crudActions.handleDelete : undefined,
    });
    
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
    // THE FIX: The `data` prop is now correctly cast to the view's row type,
    // and the exportConfig also correctly references the view name.
    data: inventory as Row<'v_inventory_items'>[],
    onRefresh: async () => { await refetch(); toast.success('Inventory refreshed!'); },
    onAddNew: canPerformActions ? editModal.openAdd : undefined,
    isLoading,
    exportConfig: { tableName: 'v_inventory_items' }
  });

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-4 md:p-6 space-y-6">
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