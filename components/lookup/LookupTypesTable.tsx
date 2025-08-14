"use client";

import { Button } from "@/components/common/ui/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { LookupType } from "@/components/lookup/lookup-types";

interface LookupTypesTableProps {
  lookups: LookupType[];
  onEdit: (lookup: LookupType) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  selectedCategory: string;
  searchTerm: string;
}

export function LookupTypesTable({
  lookups,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedCategory,
  searchTerm
}: LookupTypesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Short Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {lookups.map((lookup) => (
            <tr key={lookup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[150px] break-words">
                {lookup.name ?? "-"}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                {lookup.code || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs break-words">
                {lookup.description || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => onToggleStatus(lookup.id, !!lookup.status)}
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    lookup.status
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                  }`}
                  disabled={!!lookup.is_system_default}
                >
                  {lookup.status ? "Active" : "Inactive"}
                </Button>
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!lookup.is_system_default}
                    onClick={() => onEdit(lookup)}
                    title={
                      lookup.is_system_default
                        ? "Cannot edit system default"
                        : "Edit"
                    }
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${lookup.name}"?`)) {
                        onDelete(lookup.id);
                      }
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    disabled={!!lookup.is_system_default}
                    title={
                      lookup.is_system_default
                        ? "Cannot delete system default"
                        : "Delete"
                    }
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {lookups.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `No lookup types found matching "${searchTerm}" in category "${selectedCategory}".`
            : `No lookup types found for category "${selectedCategory}".`}
        </div>
      )}
    </div>
  );
}