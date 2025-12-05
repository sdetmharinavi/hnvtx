// path: config/table-columns/InventoryTableColumns.tsx
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { formatDate, formatCurrency } from '@/utils/formatters';

export const getInventoryTableColumns = (): Column<V_inventory_itemsRowSchema>[] => [
    {
        key: 'asset_no',
        title: 'Asset No',
        searchable: true,
        sortable: true,
        dataIndex: 'asset_no',
        width: 120,
        render: (val) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{val as string || '-'}</span>
    },
    {
        key: 'name',
        title: 'Item Name',
        searchable: true,
        sortable: true,
        dataIndex: 'name',
        width: 220,
        render: (val, record) => (
            <div className='flex flex-col gap-1'>
                <TruncateTooltip text={val as string} className="font-semibold text-gray-900 dark:text-white" />
                {record.description && (
                     <TruncateTooltip text={record.description} className="text-xs text-gray-500 dark:text-gray-400" />
                )}
            </div>
        )
    },
    {
        key: 'category_name',
        title: 'Category',
        dataIndex: 'category_name',
        width: 140,
        // hidden: true // Hide by default to save space, enable in column picker
    },
    {
        key: 'quantity',
        title: 'Qty',
        searchable: true,
        sortable: true,
        dataIndex: 'quantity',
        width: 80,
        render: (val) => (
            <span className={`font-bold ${Number(val) === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {val as number}
            </span>
        )
    },
    {
        key: 'cost',
        title: 'Unit Cost', // Renamed for clarity
        searchable: true,
        sortable: true,
        dataIndex: 'cost',
        width: 120,
        render: (val) => val ? <span className="text-gray-600 dark:text-gray-400">{formatCurrency(Number(val))}</span> : '-',
    },
    {
        key: 'total_value',
        title: 'Total Value', // New Column
        sortable: true,
        dataIndex: 'total_value',
        width: 140,
        // Fallback calculation if view update hasn't propagated or for instant optimistic UI updates
        render: (val, record) => {
            // Prefer the view's calculation, fallback to client-side math
            const total = val ?? ((record.quantity || 0) * (record.cost || 0));
            return <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(total))}</span>;
        }
    },
    {
        key: 'last_issued_to',
        title: 'Last Issued To',
        dataIndex: 'last_issued_to',
        width: 150,
        render: (val, record) => val ? (
            <div className="flex flex-col text-xs">
                <span className="font-medium text-gray-800 dark:text-gray-200">{val as string}</span>
                <span className="text-gray-500">{formatDate(record?.last_issued_date as string, { format: 'dd-mm-yyyy' })}</span>
            </div>
        ) : <span className="text-xs text-gray-400 italic">Never Issued</span>
    },
    {
        key: 'last_issue_reason',
        title: 'Issued For',
        dataIndex: 'last_issue_reason',
        width: 150,
        render: (val) => {
            return val ? (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{val as string}</span>
                </div>
            ) : <span className="text-xs text-gray-400 italic">NA</span>
        }
    },
    {
        key: 'store_location',
        title: 'Location',
        dataIndex: 'store_location',
        width: 150,
    },
    {
        key: 'status_name',
        title: 'Status',
        dataIndex: 'status_name',
        width: 100,
        render: (val) => (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                val === 'Working' || val === 'Good' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                val === 'Faulty' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
                {val as string || 'Unknown'}
            </span>
        )
    }
];