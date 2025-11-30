// path: app/dashboard/inventory/InventoryTableColumns.tsx
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { formatDate } from '@/utils/formatters';

export const getInventoryTableColumns = (): Column<V_inventory_itemsRowSchema>[] => [
    {
        key: 'asset_no',
        title: 'Asset No',
        searchable: true,
        sortable: true,
        dataIndex: 'asset_no',
        render: (val) => <span className="font-mono text-xs">{val as string}</span>
    },
    {
        key: 'name',
        title: 'Name',
        searchable: true,
        sortable: true,
        dataIndex: 'name',
        width: 180,
        render: (val, record) => (
            <div className='contain-content text-wrap'>
                <TruncateTooltip text={val as string} className="font-semibold" />
                <p className="text-xs text-gray-500 max-w-44 wrap-break-word">{record.description}</p>
            </div>
        )
    },
    {
        key: 'category_name',
        title: 'Category',
        searchable: true,
        sortable: true,
        dataIndex: 'category_name',
    },
    {
        key: 'status_name',
        title: 'Status',
        sortable: true,
        dataIndex: 'status_name',
    },
    {
        key: 'store_location',
        title: 'Location (Node)',
        searchable: true,
        sortable: true,
        dataIndex: 'store_location',
    },
    {
        key: 'functional_location',
        title: 'Functional Location (Area)',
        searchable: true,
        sortable: true,
        dataIndex: 'functional_location',
    },
    {
        key: 'quantity',
        title: 'Quantity',
        searchable: true,
        sortable: true,
        dataIndex: 'quantity',
    },
    {
        key: 'purchase_date',
        title: 'Purchase Date',
        searchable: true,
        sortable: true,
        dataIndex: 'purchase_date',
        render: (val) => formatDate(val as string, { format: 'dd-mm-yyyy' })
    },
    {
        key: 'cost',
        title: 'Cost',
        searchable: true,
        sortable: true,
        dataIndex: 'cost',
        // THE FIX: Use Rupee symbol
        render: (val) => val ? `₹${Number(val).toFixed(2)}` : null,
    }
];