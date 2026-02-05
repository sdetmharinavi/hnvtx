// app/dashboard/inventory/page.tsx
'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FiArchive, FiMinusCircle, FiClock, FiUpload, FiMapPin, FiTag } from 'react-icons/fi';
import { FaQrcode, FaRupeeSign } from 'react-icons/fa';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { Button, ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { getInventoryTableColumns } from '@/config/table-columns/InventoryTableColumns';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useInventoryData } from '@/hooks/data/useInventoryData';
import { useIssueInventoryItem } from '@/hooks/inventory-actions';
import { useInventoryExcelUpload } from '@/hooks/database/excel-queries/useInventoryExcelUpload';
import { useLookupTypeOptions, useActiveNodeOptions } from '@/hooks/data/useDropdownOptions';
import { V_inventory_itemsRowSchema, Inventory_itemsInsertSchema } from '@/schemas/zod-schemas';
import { formatCurrency } from '@/utils/formatters';
import { useUser } from '@/providers/UserProvider';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { EnhancedUploadResult } from '@/hooks/database';
import { DataGrid } from '@/components/common/DataGrid';
import { PERMISSIONS } from '@/config/permissions';

const InventoryFormModal = dynamic(
  () => import('@/components/inventory/InventoryFormModal').then((mod) => mod.InventoryFormModal),
  { loading: () => <PageSpinner text='Loading Inventory Form...' /> },
);

const IssueItemModal = dynamic(
  () => import('@/components/inventory/IssueItemModal').then((mod) => mod.IssueItemModal),
  { loading: () => <PageSpinner text='Loading Issue Form...' /> },
);

const InventoryHistoryModal = dynamic(
  () =>
    import('@/components/inventory/InventoryHistoryModal').then((mod) => mod.InventoryHistoryModal),
  { loading: () => <PageSpinner text='Loading History...' /> },
);

const UploadResultModal = dynamic(
  () => import('@/components/common/ui/UploadResultModal').then((mod) => mod.UploadResultModal),
  { loading: () => <PageSpinner text='Loading Import Report...' /> },
);

export default function InventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [itemToIssue, setItemToIssue] = useState<V_inventory_itemsRowSchema | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);

  const {
    data: inventory,
    totalCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    editModal,
    deleteModal,
    actions: crudActions,
    filters,
    bulkActions,
  } = useCrudManager<'inventory_items', V_inventory_itemsRowSchema>({
    tableName: 'inventory_items',
    dataQueryHook: useInventoryData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'asset_no'],
    syncTables: [
      'inventory_items',
      'v_inventory_items',
      'inventory_transactions',
      'v_inventory_transactions_extended',
    ],
  });

  const { mutate: issueItem, isPending: isIssuing } = useIssueInventoryItem();
  const [uploadResult, setUploadResult] = useState<EnhancedUploadResult | null>(null);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);

  const { mutate: uploadInventory, isPending: isUploading } = useInventoryExcelUpload({
    onSuccess: (result) => {
      setUploadResult(result);
      setIsUploadResultOpen(true);
      if (result.successCount > 0) refetch();
    },
  });

  const { options: categoryOptions, isLoading: loadingCats } =
    useLookupTypeOptions('INVENTORY_CATEGORY');
  const { options: locationOptions, isLoading: loadingLocs } = useActiveNodeOptions();

  // --- Filter Config ---
  const filterConfigs = useMemo(
    () => [
      { key: 'category_id', label: 'Category', options: categoryOptions, isLoading: loadingCats },
      { key: 'location_id', label: 'Location', options: locationOptions, isLoading: loadingLocs },
    ],
    [categoryOptions, locationOptions, loadingCats, loadingLocs],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );
  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManageInventory);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

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

  const handleIssueSubmit = (data: {
    item_id: string;
    quantity: number;
    issued_to: string;
    issue_reason: string;
    issued_date: string;
  }) => {
    issueItem(data, {
      onSuccess: () => {
        refetch();
        setIsIssueModalOpen(false);
        setItemToIssue(null);
      },
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadInventory({ file });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const columns = getInventoryTableColumns();

  // Custom actions for table
  const tableActions = useMemo(() => {
    const standardActions = createStandardActions<V_inventory_itemsRowSchema>({
      onEdit: canEdit ? editModal.openEdit : undefined,
      onDelete: canDelete ? crudActions.handleDelete : undefined,
    });
    standardActions.unshift({
      key: 'history',
      label: 'History',
      icon: <FiClock />,
      onClick: (r) => handleOpenHistory(r),
      variant: 'secondary',
    });
    if (canEdit) {
      standardActions.unshift({
        key: 'issue',
        label: 'Issue',
        icon: <FiMinusCircle className='text-orange-600' />,
        onClick: (r) => handleOpenIssueModal(r),
        variant: 'secondary',
        disabled: (r) => (r.quantity || 0) <= 0,
      });
    }
    standardActions.unshift({
      key: 'qr-code',
      label: 'QR',
      icon: <FaQrcode />,
      onClick: (r) => router.push(`/dashboard/inventory/qr/${r.id}`),
      variant: 'secondary',
    });
    return standardActions;
  }, [editModal.openEdit, crudActions.handleDelete, canEdit, canDelete, router]);

  const headerActions = useStandardHeaderActions({
    data: inventory,
    onRefresh: refetch,
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isFetching: isFetching,
    isLoading,
    exportConfig: canEdit ? { tableName: 'v_inventory_items', useRpc: true } : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Importing...' : 'Import',
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      onClick: () => fileInputRef.current?.click(),
      hideTextOnMobile: true,
    });
  }

  // --- REFACTORED RENDER GRID using DataGrid ---
  const renderItem = useCallback(
    (item: V_inventory_itemsRowSchema) => {
      const quantity = item.quantity || 0;
      const totalValue = (item.cost || 0) * quantity;

      let stockStatusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      let stockLabel = 'In Stock';
      if (quantity === 0) {
        stockStatusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        stockLabel = 'Out of Stock';
      } else if (quantity < 5) {
        stockStatusColor =
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        stockLabel = 'Low Stock';
      }

      return (
        <GenericEntityCard
          key={item.id}
          entity={item}
          title={item.name || 'Unnamed Item'}
          status={item.status_name || 'Unknown'}
          subBadge={
            <div className='flex items-center gap-2 mb-2'>
              <span className='font-mono text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded'>
                {item.asset_no || 'NO ID'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stockStatusColor}`}
              >
                {stockLabel}
              </span>
            </div>
          }
          headerIcon={<FiArchive className='w-6 h-6 text-blue-500' />}
          dataItems={[
            { icon: FiMapPin, label: 'Location', value: item.store_location || 'Unknown' },
            { icon: FiTag, label: 'Category', value: item.category_name || 'Uncategorized' },
            {
              icon: FaRupeeSign,
              label: 'Total Value',
              value: (
                <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                  {formatCurrency(totalValue)}
                </span>
              ),
            },
          ]}
          customFooter={
            <div className='flex items-center justify-between w-full'>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Unit Cost: {formatCurrency(item.cost || 0)}
              </div>
              <div className='text-right'>
                <span className='text-2xl font-bold text-gray-900 dark:text-white'>{quantity}</span>
                <div className='text-[10px] text-gray-500 uppercase'>Qty</div>
              </div>
            </div>
          }
          extraActions={
            <>
              {canEdit && (
                <Button
                  size='xs'
                  variant='primary'
                  onClick={() => handleOpenIssueModal(item)}
                  disabled={quantity <= 0}
                  title='Issue Stock'
                >
                  <FiMinusCircle className='w-4 h-4' />
                </Button>
              )}
              <Button
                size='xs'
                variant='secondary'
                onClick={() => handleOpenHistory(item)}
                title='View History'
              >
                <FiClock className='w-4 h-4' />
              </Button>
              <Button
                size='xs'
                variant='secondary'
                onClick={() => router.push(`/dashboard/inventory/qr/${item.id}`)}
                title='QR Code'
              >
                <FaQrcode className='w-4 h-4' />
              </Button>
            </>
          }
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={() => handleOpenHistory(item)}
        />
      );
    },
    [canEdit, canDelete, crudActions.handleDelete, editModal.openEdit, router],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Inventory',
        description: 'Track physical assets, stock levels, and movements.',
        icon: <FiArchive />,
        stats: [
          { value: totalCount, label: 'Total Items' },
          { value: formatCurrency(totalInventoryValue), label: 'Total Value', color: 'success' },
        ],
        actions: headerActions,
        isLoading,
        isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search asset, name, desc...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'item',
        showStatusUpdate: false,
        canDelete: () => canDelete,
      }}
      renderGrid={() => (
        <DataGrid
          data={inventory}
          renderItem={renderItem}
          isLoading={isLoading}
          isEmpty={inventory.length === 0}
        />
      )}
      tableProps={{
        tableName: 'v_inventory_items',
        data: inventory,
        columns: columns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: tableActions,
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_inventory_itemsRowSchema & { id: string } => !!row.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={inventory.length === 0 && !isLoading}
      emptyState={
        <div className='col-span-full py-16 text-center text-gray-500'>
          <FiArchive className='w-12 h-12 mx-auto mb-3 text-gray-300' />
          <p>No items found matching your criteria.</p>
        </div>
      }
      modals={
        <>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            className='hidden'
            accept='.xlsx, .xls'
          />

          <UploadResultModal
            isOpen={isUploadResultOpen}
            onClose={() => setIsUploadResultOpen(false)}
            result={uploadResult}
            title='Inventory Import Report'
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
            title='Confirm Deletion'
            message={deleteModal.message}
            loading={deleteModal.loading}
            type='danger'
          />
        </>
      }
    />
  );
}
