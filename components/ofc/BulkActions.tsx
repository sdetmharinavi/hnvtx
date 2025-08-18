import { FiTrash2 } from "react-icons/fi";

interface BulkActionsProps {
  selectedCount: number;
  isOperationLoading?: boolean;
  onBulkDelete: () => void;
  onBulkUpdateStatus: (status: "active" | "inactive") => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  isOperationLoading = false,
  onBulkDelete,
  onBulkUpdateStatus,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-blue-900">{selectedCount} ofc cable(s) selected</p>
        <div className="flex items-center gap-3">
          <select
            onChange={(e) => {
              const v = e.target.value as "active" | "inactive" | "";
              if (v) onBulkUpdateStatus(v);
            }}
            defaultValue=""
            className="text-sm border rounded px-2 py-1"
            disabled={isOperationLoading}
          >
            <option value="">Set Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={onBulkDelete}
            disabled={isOperationLoading}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm disabled:opacity-50"
          >
            <FiTrash2 className="inline mr-1" /> Delete
          </button>
          <button onClick={onClearSelection} className="text-gray-500 hover:text-gray-700 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
