// app/dashboard/inventory/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { FiArchive, FiClock, FiMapPin, FiTag } from 'react-icons/fi';
import { FaQrcode, FaRupeeSign } from 'react-icons/fa';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { Button, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { getInventoryTableColumns } from '@/config/table-columns/InventoryTableColumns';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useInventoryData } from '@/hooks/data/useInventoryData';
import { useLookupTypeOptions, useActiveNodeOptions } from '@/hooks/data/useDropdownOptions';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { formatCurrency } from '@/utils/formatters';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { DataGrid } from '@/components/common/DataGrid';
import { StatProps } from '@/components/common/page-header/StatCard';

const InventoryHistoryModal = dynamic(
  () =>
    import('@/components/inventory/InventoryHistoryModal').then((mod) => mod.InventoryHistoryModal),
  { loading: () => <PageSpinner text='Loading History...' /> },
);

export default function InventoryPage() {
  const router = useRouter();

  const[viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const[isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);

  const {
    data: inventory,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
  } = useCrudManager<'inventory_items', V_inventory_itemsRowSchema>({
    tableName: 'inventory_items',
    dataQueryHook: useInventoryData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'asset_no'],
  });

  const { options: categoryOptions, isLoading: loadingCats } =
    useLookupTypeOptions('INVENTORY_CATEGORY');
  const { options: locationOptions, isLoading: loadingLocs } = useActiveNodeOptions();

  const filterConfigs = useMemo(
    () =>[
      { key: 'category_id', label: 'Category', options: categoryOptions, isLoading: loadingCats },
      { key: 'location_id', label: 'Location', options: locationOptions, isLoading: loadingLocs },
    ],[categoryOptions, locationOptions, loadingCats, loadingLocs],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev,[key]: value }));
    },
    [filters],
  );

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((acc, item) => acc + (item.total_value || 0), 0);
  }, [inventory]);

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.stock_status;
    const inStockCount = inventory.filter((i) => (i.quantity || 0) > 0).length;
    const outOfStockCount = inventory.filter((i) => (i.quantity || 0) <= 0).length;

    return[
      {
        value: totalCount,
        label: 'Total Items',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.stock_status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: formatCurrency(totalInventoryValue),
        label: 'Total Value',
        color: 'success',
      },
      {
        value: inStockCount,
        label: 'In Stock',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, stock_status: 'in_stock' })),
        isActive: currentStatus === 'in_stock',
      },
      {
        value: outOfStockCount,
        label: 'Out of Stock',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, stock_status: 'out_of_stock' })),
        isActive: currentStatus === 'out_of_stock',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[totalCount, totalInventoryValue, inventory, filters.filters.stock_status, filters.setFilters]);

  const handleOpenHistory = (record: V_inventory_itemsRowSchema) => {
    if (!record.id) return;
    setHistoryItem({ id: record.id, name: record.name || 'Item' });
    setIsHistoryModalOpen(true);
  };

  const columns = getInventoryTableColumns();

  const tableActions = useMemo(() => {
    const standardActions = createStandardActions<V_inventory_itemsRowSchema>({});
    standardActions.unshift({
      key: 'history',
      label: 'History',
      icon: <FiClock />,
      onClick: (r) => handleOpenHistory(r),
      variant: 'secondary',
    });
    standardActions.unshift({
      key: 'qr-code',
      label: 'QR',
      icon: <FaQrcode />,
      onClick: (r) => router.push(`/dashboard/inventory/qr/${r.id}`),
      variant: 'secondary',
    });
    return standardActions;
  }, [router]);

  const headerActions = useStandardHeaderActions({
    data: inventory,
    onRefresh: refetch,
    isFetching: isFetching,
    isLoading,
    exportConfig: { tableName: 'v_inventory_items', useRpc: true },
  });

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
        stockStatusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
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
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stockStatusColor}`}>
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
              value: <span className='font-bold text-emerald-600 dark:text-emerald-400'>{formatCurrency(totalValue)}</span>,
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
              <Button size='xs' variant='secondary' onClick={() => handleOpenHistory(item)} title='View History'>
                <FiClock className='w-4 h-4' />
              </Button>
              <Button size='xs' variant='secondary' onClick={() => router.push(`/dashboard/inventory/qr/${item.id}`)} title='QR Code'>
                <FaQrcode className='w-4 h-4' />
              </Button>
            </>
          }
          onView={() => handleOpenHistory(item)}
        />
      );
    },
    [router],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Inventory Viewer',
        description: 'Track physical assets, stock levels, and past movements.',
        icon: <FiArchive />,
        stats: headerStats,
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
      renderGrid={() => (
        <DataGrid data={inventory} renderItem={renderItem} isLoading={isLoading} isEmpty={inventory.length === 0} />
      )}
      tableProps={{
        tableName: 'v_inventory_items',
        data: inventory,
        columns: columns,
        loading: isLoading,
        isFetching: isFetching,
        actions: tableActions,
        selectable: false,
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
          {isHistoryModalOpen && historyItem && (
            <InventoryHistoryModal
              isOpen={isHistoryModalOpen}
              onClose={() => setIsHistoryModalOpen(false)}
              itemId={historyItem.id}
              itemName={historyItem.name}
            />
          )}
        </>
      }
    />
  );
}