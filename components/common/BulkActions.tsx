// BulkActions Component (Enhanced version)
import { FiTrash2, FiCheck, FiX } from "react-icons/fi";

interface BulkActionsProps {
  selectedCount: number;
  isOperationLoading?: boolean;
  onBulkDelete: () => void;
  onBulkUpdateStatus: (status: "active" | "inactive") => void;
  onClearSelection: () => void;
  entityName?: string;
  showStatusUpdate?: boolean;
  canDelete?: () => boolean;
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }>;
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
  customActions = [],
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

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    const baseClasses = "px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1";
    
    switch (variant) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800`;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-900/20 dark:border-blue-700/50 transition-all duration-200">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FiCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-900 dark:text-blue-100 font-medium">
            {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''} selected
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Update Dropdown */}
          {showStatusUpdate && (
            <select
              onChange={handleStatusChange}
              defaultValue=""
              className="text-sm border rounded px-2 py-1 min-w-[100px]
                        bg-white text-gray-900 border-gray-300
                        dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
                        disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isOperationLoading}
            >
              <option value="">Set Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          )}

          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={isOperationLoading || action.disabled}
              className={getButtonClasses(action.variant)}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </button>
          ))}
          
          {/* Delete Button */}
          <button
            onClick={onBulkDelete}
            disabled={isOperationLoading || !canDelete()}
            className={getButtonClasses('danger')}
            title={`Delete ${selectedCount} selected ${entityName}${selectedCount !== 1 ? 's' : ''}`}
          >
            <FiTrash2 className="w-4 h-4" />
            Delete {selectedCount > 1 && `(${selectedCount})`}
          </button>
          
          {/* Clear Selection Button */}
          <button
            onClick={onClearSelection}
            disabled={isOperationLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 
                      text-sm px-2 py-1 rounded transition-colors flex items-center gap-1"
            title="Clear selection"
          >
            <FiX className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isOperationLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Processing {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''}...
        </div>
      )}
    </div>
  );
}

