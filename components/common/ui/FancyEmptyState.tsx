import { LucideIcon, Search, FolderOpen } from "lucide-react";

interface FancyEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function FancyEmptyState({ 
  icon: Icon = FolderOpen, 
  title = "No records found", 
  description = "Get started by adding a new record.",
  action 
}: FancyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-gray-800">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl opacity-50" />
        <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
          <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {description}
      </p>

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export function SearchEmptyState({ query, onClear }: { query: string, onClear?: () => void }) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Search className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-900 dark:text-white font-medium mb-1">
            No results for &quot;{query}&quot;
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Try checking for typos or using different keywords.
        </p>
        {onClear && (
            <button 
                onClick={onClear}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
                Clear Search
            </button>
        )}
      </div>
    );
}