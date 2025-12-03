import { useServicePathDisplay } from "@/hooks/database/system-connection-hooks";
import TruncateTooltip from "@/components/common/TruncateTooltip";
import { LoadingSpinner } from "@/components/common/ui/LoadingSpinner";

export const PathDisplay = ({ systemConnectionId }: { systemConnectionId: string | null }) => {
  const { data: pathData, isLoading } = useServicePathDisplay(systemConnectionId);

  if (isLoading) {
    return <div className='flex items-center gap-2 text-xs text-gray-400'><LoadingSpinner size="xs" /> Loading path...</div>;
  }

  if (!pathData || Object.keys(pathData).length === 0) {
    return <div className='text-xs text-gray-400 italic'>Not Provisioned</div>;
  }

  const renderPath = (label: string, path: string | undefined, colorClass: string) => {
    if (!path) return null;
    return (
      <div className="flex items-start gap-2 text-xs">
        <span className={`font-bold whitespace-nowrap min-w-[40px] ${colorClass}`}>{label}:</span>
        <TruncateTooltip text={path} className='text-gray-700 dark:text-gray-300 font-mono' />
      </div>
    );
  };

  return (
    <div className='space-y-1.5 w-full max-w-md p-2 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-100 dark:border-gray-800'>
      {renderPath("W-Tx", pathData.working_tx, "text-blue-600 dark:text-blue-400")}
      {renderPath("W-Rx", pathData.working_rx, "text-green-600 dark:text-green-400")}
      {renderPath("P-Tx", pathData.protection_tx, "text-purple-600 dark:text-purple-400")}
      {renderPath("P-Rx", pathData.protection_rx, "text-orange-600 dark:text-orange-400")}
    </div>
  );
};