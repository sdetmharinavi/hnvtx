import { motion } from "framer-motion";
import { FiTrash2 } from "react-icons/fi";
import { UserRole } from "@/types/user-roles";

interface BulkActionsProps {
  selectedCount: number;
  isSuperAdmin: boolean;
  isOperationLoading: boolean;
  onBulkDelete: () => void;
  onBulkUpdateRole: (role: string) => void;
  onBulkUpdateStatus: (status: string) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  isSuperAdmin,
  isOperationLoading,
  onBulkDelete,
  onBulkUpdateRole,
  onBulkUpdateStatus,
  onClearSelection,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-blue-900 dark:text-blue-200">
          {selectedCount} user(s) selected
        </p>
        <div className="flex items-center gap-3">
          <select
            onChange={(e) => e.target.value && onBulkUpdateRole(e.target.value)}
            defaultValue=""
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            disabled={isOperationLoading}
          >
            <option value="">Set Role</option>
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => e.target.value && onBulkUpdateStatus(e.target.value)}
            defaultValue=""
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            disabled={isOperationLoading}
          >
            <option value="">Set Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
          {isSuperAdmin && (
            <button
              onClick={onBulkDelete}
              disabled={isOperationLoading}
              className="bg-red-600 dark:bg-red-700 text-white px-3 py-1 rounded hover:bg-red-700 dark:hover:bg-red-800 text-sm disabled:opacity-50"
            >
              <FiTrash2 className="inline mr-1" /> Delete
            </button>
          )}
          <button
            onClick={onClearSelection}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}