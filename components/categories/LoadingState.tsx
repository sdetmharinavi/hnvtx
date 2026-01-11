import { LoadingSpinner } from '@/components/common/ui/LoadingSpinner';

export function LoadingState() {
  return (
    <div className="flex justify-center py-8">
      <LoadingSpinner />
      <span className="ml-2 dark:text-gray-400">Loading data...</span>
    </div>
  );
}
