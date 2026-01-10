'use client';

import { RotateCcw, RotateCw, Plus, Minus } from 'lucide-react';

interface MapControlsProps {
  onBack?: () => void;
  showAllNodePopups: boolean;
  setShowAllNodePopups: (show: boolean) => void;
  showAllLinePopups: boolean;
  setShowAllLinePopups: (show: boolean) => void;
  onRotate: (deg: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const MapControls = ({
  onBack,
  showAllNodePopups,
  setShowAllNodePopups,
  showAllLinePopups,
  setShowAllLinePopups,
  onRotate,
  onZoomIn,
  onZoomOut,
}: MapControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2 no-print">
      {/* Menu Controls */}
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors text-left"
          >
            ← Back
          </button>
        )}
        <button
          onClick={() => setShowAllNodePopups(!showAllNodePopups)}
          className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors text-left"
        >
          <span className={showAllNodePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
          {showAllNodePopups ? 'Hide' : 'Show'} Node Info
        </button>
        <button
          onClick={() => setShowAllLinePopups(!showAllLinePopups)}
          className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors text-left"
        >
          <span className={showAllLinePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
          {showAllLinePopups ? 'Hide' : 'Show'} Line Info
        </button>
      </div>

      {/* Zoom & Rotation Controls */}
      <div className="flex gap-2">
        {/* Zoom Group */}
        <div className="flex flex-col gap-px bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Zoom In"
          >
            <Plus size={18} />
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Zoom Out"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* Rotation Group */}
        <div className="flex gap-px bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => onRotate(-90)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Rotate Left"
          >
            <RotateCcw size={18} />
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => onRotate(90)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Rotate Right"
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
