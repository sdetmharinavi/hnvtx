import { FiTrash2 } from "react-icons/fi";

interface BulkActionsProps {
  selectedCount: number;
  isOperationLoading?: boolean;
  onBulkDelete: () => void;
  onBulkUpdateStatus: (status: "active" | "inactive") => void;
  onClearSelection: () => void;
  entityName?: string; // "ofc cable", "employee", etc.
  showStatusUpdate?: boolean;
  canDelete?: () => boolean;
}

export function BulkActions({
  selectedCount,
  isOperationLoading = false,
  onBulkDelete,
  onBulkUpdateStatus,
  onClearSelection,
  entityName = "item",
  showStatusUpdate = true,
  canDelete = () => true,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "active" | "inactive" | "";
    if (value) {
      onBulkUpdateStatus(value);
      // Reset select to default
      e.target.value = "";
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-900/20 dark:border-blue-700/50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-blue-900 dark:text-blue-100">
          {selectedCount} {entityName}(s) selected
        </p>
        <div className="flex items-center gap-3">
          {showStatusUpdate && (
            <select
              onChange={handleStatusChange}
              defaultValue=""
              className="text-sm border rounded px-2 py-1
                        bg-white text-gray-900 border-gray-300
                        dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
                        disabled:opacity-50"
              disabled={isOperationLoading}
            >
              <option value="">Set Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
          
          <button
            onClick={onBulkDelete}
            disabled={isOperationLoading || !canDelete()}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700
                      dark:bg-red-700 dark:hover:bg-red-800
                      text-sm disabled:opacity-50"
          >
            <FiTrash2 className="inline mr-1" /> Delete
          </button>
          
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-gray-700
                      dark:text-gray-400 dark:hover:text-gray-300
                      text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}