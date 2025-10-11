import Link from "next/link";
import { FiEdit2, FiInfo } from "react-icons/fi";
import { Button } from "@/components/common/ui/Button";
import { Card } from "@/components/common/ui/card";
import { formatCategoryName } from "@/components/categories/utils";
import { Categories, CategoryInfo } from "./categories-types";
import { useUser } from "@/providers/UserProvider";

interface CategoriesTableProps {
  categories: Categories[];
  categoryLookupCounts: Record<string, CategoryInfo>;
  totalCategories: number;
  onEdit: (categoryName: string) => void;
  onDelete: (categoryName: string) => void;
  isDeleting: boolean;
  searchTerm?: string;
}

export function CategoriesTable({
  categories,
  categoryLookupCounts,
  totalCategories,
  onEdit,
  onDelete,
  isDeleting,
  searchTerm,
}: CategoriesTableProps) {

  const { isSuperAdmin } = useUser();
  return (
    <Card className="overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {categories.length} of {totalCategories} unique categories
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Raw Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Lookup Types Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  System Defaults
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {categories.map((category) => {
                const categoryInfo = categoryLookupCounts[category.category];
                return (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                      {formatCategoryName(category)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <Link
                        href={`/dashboard/lookup?category=${category.category}`}
                      >
                        <span className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                          {categoryInfo?.lookupCount ?? 0}
                          {categoryInfo?.lookupCount > 0 && (
                            <FiInfo
                              className="h-3 w-3 text-blue-500 dark:text-blue-400"
                              title="Click to view lookup types"
                            />
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          categoryInfo?.hasSystemDefaults
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {categoryInfo?.hasSystemDefaults ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(category.category)}
                          className="dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(category.category)}
                          className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 dark:border-gray-600 dark:hover:bg-gray-700"
                          disabled={!isSuperAdmin && (isDeleting || categoryInfo?.hasSystemDefaults)}
                          title={
                            isDeleting
                              ? "Deleting..."
                              : `Delete All "${category.category}" Categories`
                          }
                        >
                          {isDeleting
                            ? "Deleting..."
                            : `Delete All "${category.category}" Categories`}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {searchTerm
            ? `No unique categories found matching "${searchTerm}".`
            : "No unique categories found."}
        </div>
      )}
    </Card>
  );
}