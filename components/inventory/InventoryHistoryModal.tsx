// components/inventory/InventoryHistoryModal.tsx
"use client";

import { Modal } from "@/components/common/ui/Modal";
import { DataTable } from "@/components/table";
import { useInventoryHistory } from "@/hooks/data/useInventoryHistory";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Row } from "@/hooks/database";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import TruncateTooltip from "../common/TruncateTooltip";

interface InventoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName: string;
}

export const InventoryHistoryModal = ({
  isOpen,
  onClose,
  itemId,
  itemName,
}: InventoryHistoryModalProps) => {
  const { data: history = [], isLoading } = useInventoryHistory(itemId);

  const columns: Column<Row<'v_inventory_transactions_extended'>>[] = [
    {
      key: "issued_date",
      title: "Date",
      dataIndex: "issued_date",
      width: 120,
      render: (val) => formatDate(val as string, { format: "dd-mm-yyyy" }),
    },
    {
      key: "transaction_type",
      title: "Type",
      dataIndex: "transaction_type",
      width: 100,
      render: (val) => {
        const type = val as string;
        if (type === "ISSUE") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              <ArrowUpRight className="w-3 h-3" /> Issue
            </span>
          );
        }
        if (type === "RESTOCK" || type === "ADD") {
           return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <ArrowDownLeft className="w-3 h-3" /> In
            </span>
          );
        }
        return <span className="text-xs font-medium">{type}</span>;
      },
    },
    {
      key: "quantity",
      title: "Qty",
      dataIndex: "quantity",
      width: 80,
      render: (val) => <span className="font-mono font-bold">{val as number}</span>
    },
    {
      key: "issued_to",
      title: "Issued To / Party",
      dataIndex: "issued_to",
      width: 180,
      render: (val) => val ? <TruncateTooltip text={val as string} className="font-medium" /> : <span className="text-gray-400">-</span>
    },
    {
      key: "issue_reason",
      title: "Reason",
      dataIndex: "issue_reason",
      width: 200,
      render: (val) => <TruncateTooltip text={val as string || 'N/A'} />
    },
    {
      key: "total_cost_calculated",
      title: "Value",
      dataIndex: "total_cost_calculated",
      width: 120,
      render: (val) => val ? formatCurrency(val as number) : '-'
    },
    {
      key: "performed_by_name",
      title: "Recorded By",
      dataIndex: "performed_by_name",
      width: 150,
      render: (val) => <span className="text-xs text-gray-500">{val as string}</span>
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`History: ${itemName}`} size="xl">
      <div className="p-6">
             <DataTable
      autoHideEmptyColumns={true}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tableName={'v_inventory_transactions_extended' as any} // Type assertion to bypass strict literal check for this specific view
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={history as any[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          columns={columns as any[]}
          loading={isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total: history.length,
            onChange: () => {}, // Local pagination inside modal is usually sufficient
          }}
          searchable={false}
        />
      </div>
    </Modal>
  );
};