// path: app/dashboard/inventory/InventoryTableColumns.tsx
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { formatDate } from '@/utils/formatters';

export const getInventoryTableColumns = (): Column<V_inventory_itemsRowSchema>[] => [
    {
        key: 'asset_no',
        title: 'Asset No',
        dataIndex: 'asset_no',
        render: (val) => <span className="font-mono text-xs">{val as string}</span>
    },
    {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        render: (val, record) => (
            <div>
                <TruncateTooltip text={val as string} className="font-semibold" />
                <p className="text-xs text-gray-500">{record.description}</p>
            </div>
        )
    },
    {
        key: 'category_name',
        title: 'Category',
        dataIndex: 'category_name',
    },
    {
        key: 'status_name',
        title: 'Status',
        dataIndex: 'status_name',
    },
    {
        key: 'store_location',
        title: 'Location (Node)',
        dataIndex: 'store_location',
    },
    {
        key: 'functional_location',
        title: 'Functional Location (Area)',
        dataIndex: 'functional_location',
    },
    {
        key: 'quantity',
        title: 'Quantity',
        dataIndex: 'quantity',
    },
    {
        key: 'purchase_date',
        title: 'Purchase Date',
        dataIndex: 'purchase_date',
        render: (val) => formatDate(val as string, { format: 'dd-mm-yyyy' })
    },
    {
        key: 'cost',
        title: 'Cost',
        dataIndex: 'cost',
        render: (val) => val ? `$${Number(val).toFixed(2)}` : null,
    }
];