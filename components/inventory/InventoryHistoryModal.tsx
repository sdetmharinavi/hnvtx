// components/inventory/InventoryHistoryModal.tsx
'use client';

import { Modal } from '@/components/common/ui/Modal';
import { DataTable } from '@/components/table';
import { useInventoryHistory } from '@/hooks/data/useInventoryHistory';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { Row, useTableUpdate } from '@/hooks/database';
import { ArrowUpRight, ArrowDownLeft, Hash, Tag, MapPin, Box } from 'lucide-react';
import TruncateTooltip from '../common/TruncateTooltip';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { createClient } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { FaRupeeSign } from 'react-icons/fa';
import React from 'react';

// Reusable stat box component for the header
const StatBox = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-start gap-3'>
    <div className='mt-0.5 bg-white dark:bg-gray-800 p-1.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-center'>
      {icon}
    </div>
    <div className='min-w-0 flex-1'>
      <p className='text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-0.5'>
        {label}
      </p>
      <div className='text-sm font-semibold text-gray-900 dark:text-gray-100 truncate'>{value}</div>
    </div>
  </div>
);

interface InventoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: V_inventory_itemsRowSchema | null;
}

export const InventoryHistoryModal = ({ isOpen, onClose, item }: InventoryHistoryModalProps) => {
  const itemId = item?.id || null;
  const itemName = item?.name || 'Item';

  const { data: history = [], isLoading } = useInventoryHistory(itemId);

  const { isSuperAdmin, role } = useUser();
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO;

  const supabase = createClient();
  const queryClient = useQueryClient();

  const { mutate: updateTransaction } = useTableUpdate(supabase, 'inventory_transactions', {
    onSuccess: () => {
      toast.success('Transaction log updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['inventory-history', itemId] });
      queryClient.invalidateQueries({ queryKey: ['v_inventory_transactions_extended'] });
      queryClient.invalidateQueries({ queryKey: ['v_inventory_items'] });
    },
    onError: (err) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCellEdit = (record: any, column: Column<any>, newValue: string) => {
    let finalValue: any = newValue;
    if (typeof newValue === 'string' && newValue.trim() === '') {
      finalValue = null;
    }

    updateTransaction({
      id: record.id,
      data: { [column.dataIndex]: finalValue } as any,
    });
  };

  const columns: Column<Row<'v_inventory_transactions_extended'>>[] = [
    {
      key: 'issued_date',
      title: 'Date',
      dataIndex: 'issued_date',
      sortable: true,
      width: 120,
      editable: canEdit,
      excelFormat: 'date',
      render: (val) => formatDate(val as string, { format: 'dd-mm-yyyy' }),
    },
    {
      key: 'transaction_type',
      title: 'Type',
      dataIndex: 'transaction_type',
      width: 100,
      render: (val) => {
        const type = val as string;
        if (type === 'ISSUE') {
          return (
            <span className='inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
              <ArrowUpRight className='w-3 h-3' /> Issue
            </span>
          );
        }
        if (type === 'RESTOCK' || type === 'ADD') {
          return (
            <span className='inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
              <ArrowDownLeft className='w-3 h-3' /> In
            </span>
          );
        }
        if (type === 'ADJUSTMENT') {
          return (
            <span className='inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
              Adjustment
            </span>
          );
        }
        return <span className='text-xs font-medium'>{type}</span>;
      },
    },
    {
      key: 'quantity',
      title: 'Qty',
      dataIndex: 'quantity',
      width: 80,
      render: (val) => <span className='font-mono font-bold'>{val as number}</span>,
    },
    {
      key: 'issued_to',
      title: 'Party (Source/Dest)',
      dataIndex: 'issued_to',
      width: 180,
      editable: canEdit,
      render: (val) =>
        val ? (
          <TruncateTooltip text={val as string} className='font-medium' />
        ) : (
          <span className='text-gray-400'>-</span>
        ),
    },
    {
      key: 'issue_reason',
      title: 'Remarks/Reason',
      dataIndex: 'issue_reason',
      width: 200,
      editable: canEdit,
      render: (val) => <TruncateTooltip text={(val as string) || 'N/A'} />,
    },
    {
      key: 'total_cost_calculated',
      title: 'Value',
      dataIndex: 'total_cost_calculated',
      width: 120,
      render: (val) => (val ? formatCurrency(val as number) : '-'),
    },
    {
      key: 'performed_by_name',
      title: 'Recorded By',
      dataIndex: 'performed_by_name',
      width: 150,
      render: (val) => <span className='text-xs text-gray-500'>{val as string}</span>,
    },
  ];

  const exportFileName = `${(item?.asset_no || item?.name || 'Item').replace(/[^a-zA-Z0-9]/g, '_')}_History`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`History: ${itemName}`} size='xxl'>
      <div className='p-4 sm:p-6'>
        {item && (
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6'>
            <StatBox
              icon={<Hash className='w-4 h-4 text-gray-500 dark:text-gray-400' />}
              label='Asset No'
              value={item.asset_no || 'N/A'}
            />
            <StatBox
              icon={<Tag className='w-4 h-4 text-blue-500 dark:text-blue-400' />}
              label='Category'
              value={item.category_name || 'N/A'}
            />
            <StatBox
              icon={<MapPin className='w-4 h-4 text-emerald-500 dark:text-emerald-400' />}
              label='Location'
              value={item.store_location || 'N/A'}
            />
            <StatBox
              icon={
                <Box
                  className={`w-4 h-4 ${
                    item.quantity && item.quantity > 0
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                />
              }
              label='Current Stock'
              value={
                <span
                  className={`text-lg font-bold ${
                    item.quantity && item.quantity > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.quantity || 0}
                </span>
              }
            />
            <StatBox
              icon={<FaRupeeSign className='w-4 h-4 text-orange-500 dark:text-orange-400' />}
              label='Unit Cost'
              value={formatCurrency(item.cost || 0)}
            />
          </div>
        )}

        {canEdit && (
          <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-lg border border-blue-200 dark:border-blue-800'>
            <strong>Admin Mode:</strong> You can click directly on the <strong>Date</strong>,{' '}
            <strong>Party</strong>, or <strong>Remarks</strong> cells to edit them. (Quantity edits
            are disabled to maintain stock accuracy).
          </div>
        )}

        <div className='border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden'>
          <DataTable
            autoHideEmptyColumns={true}
            tableName={'v_inventory_transactions_extended' as any}
            data={history as any[]}
            columns={columns as any[]}
            loading={isLoading}
            onCellEdit={handleCellEdit}
            pagination={{
              current: 1,
              pageSize: 10,
              total: history.length,
              onChange: () => {},
            }}
            searchable={false}
            exportable={true}
            exportOptions={{
              fileName: exportFileName,
              // THE FIX: Provide the explicit RPC configuration to bypass RLS limits on direct view selects.
              rpcConfig: {
                functionName: 'get_paged_data',
                parameters: {
                  p_view_name: 'v_inventory_transactions_extended',
                  p_limit: 10000,
                  p_offset: 0,
                  p_order_by: 'created_at',
                  p_order_dir: 'desc',
                  p_filters: { inventory_item_id: itemId || '' },
                },
              },
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
