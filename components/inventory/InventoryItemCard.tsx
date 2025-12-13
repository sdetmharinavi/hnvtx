// components/inventory/InventoryItemCard.tsx
import React from 'react';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { FiClock, FiEdit2, FiMapPin, FiMinusCircle, FiTag, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { FaQrcode } from 'react-icons/fa';

interface InventoryItemCardProps {
  item: V_inventory_itemsRowSchema;
  onEdit: (item: V_inventory_itemsRowSchema) => void;
  onDelete: (item: V_inventory_itemsRowSchema) => void;
  onIssue: (item: V_inventory_itemsRowSchema) => void;
  onHistory: (item: V_inventory_itemsRowSchema) => void;
  onQr: (item: V_inventory_itemsRowSchema) => void;
  canManage: boolean;
  canDelete: boolean;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item, onEdit, onDelete, onIssue, onHistory, onQr, canManage, canDelete
}) => {
  const quantity = item.quantity || 0;
  
  // Stock Status Logic
  let stockStatus = { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'In Stock' };
  if (quantity === 0) {
    stockStatus = { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Out of Stock' };
  } else if (quantity < 5) {
    stockStatus = { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Low Stock' };
  }

  const totalValue = (item.cost || 0) * quantity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col group h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate" title={item.name || ''}>
                {item.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                    {item.asset_no || 'NO ASSET ID'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                </span>
            </div>
        </div>
        <div className="text-right shrink-0">
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
                 {quantity}
             </div>
             <div className="text-[10px] text-gray-500 uppercase">Qty</div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-2 flex-1 text-sm">
         <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
            <FiMapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <span className="truncate" title={item.store_location || ''}>
                {item.store_location || 'Unknown Location'}
                {item.functional_location && <span className="text-gray-400 block text-xs">{item.functional_location}</span>}
            </span>
         </div>
         <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FiTag className="w-4 h-4 shrink-0 text-gray-400" />
            <span>{item.category_name || 'Uncategorized'}</span>
         </div>
         
         <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <div className="text-xs text-gray-500">Unit Cost</div>
             <div className="font-mono font-medium text-gray-700 dark:text-gray-300">{formatCurrency(item.cost || 0)}</div>
         </div>
         <div className="flex justify-between items-center">
             <div className="text-xs text-gray-500">Total Value</div>
             <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalValue)}</div>
         </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-2 rounded-b-xl overflow-x-auto">
         {canManage && (
            <Button size="xs" variant="primary" onClick={() => onIssue(item)} disabled={quantity <= 0} title="Issue Stock">
                <FiMinusCircle className="w-4 h-4" />
            </Button>
         )}
         <Button size="xs" variant="secondary" onClick={() => onHistory(item)} title="View History">
            <FiClock className="w-4 h-4" />
         </Button>
         <Button size="xs" variant="secondary" onClick={() => onQr(item)} title="QR Code">
             <FaQrcode className="w-4 h-4" />
         </Button>
         
         <div className="flex-1"></div>

         {canManage && (
            <Button size="xs" variant="outline" onClick={() => onEdit(item)}>
                <FiEdit2 className="w-4 h-4" />
            </Button>
         )}
         
         {canDelete && (
            <Button size="xs" variant="danger" onClick={() => onDelete(item)}>
                <FiTrash2 className="w-4 h-4" />
            </Button>
         )}
      </div>
    </div>
  );
};