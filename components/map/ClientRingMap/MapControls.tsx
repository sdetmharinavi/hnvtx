'use client';

interface MapControlsProps {
  onBack?: () => void;
  showAllNodePopups: boolean;
  setShowAllNodePopups: (show: boolean) => void;
  showAllLinePopups: boolean;
  setShowAllLinePopups: (show: boolean) => void;
}

export const MapControls = ({
  onBack,
  showAllNodePopups,
  setShowAllNodePopups,
  showAllLinePopups,
  setShowAllLinePopups,
}: MapControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
      {onBack && (
        <button
          onClick={onBack}
          className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
        >
          ← Back
        </button>
      )}
      <button
        onClick={() => setShowAllNodePopups(!showAllNodePopups)}
        className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
      >
        <span className={showAllNodePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
        {showAllNodePopups ? 'Hide' : 'Show'} Node Info
      </button>
      <button
        onClick={() => setShowAllLinePopups(!showAllLinePopups)}
        className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
      >
        <span className={showAllLinePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
        {showAllLinePopups ? 'Hide' : 'Show'} Line Info
      </button>
    </div>
  );
};
