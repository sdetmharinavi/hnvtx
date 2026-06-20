// components/map/ClientRingMap/MapControls.tsx
'use client';

import { RotateCcw, RotateCw, Plus, Minus, Ruler, Zap } from 'lucide-react'; 

interface MapControlsProps {
  onBack?: () => void;
  showAllNodePopups: boolean;
  setShowAllNodePopups: (show: boolean) => void;
  showAllLinePopups: boolean;
  setShowAllLinePopups: (show: boolean) => void;
  showPowerLevels: boolean;
  setShowPowerLevels: (show: boolean) => void;
  onRotate: (deg: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMeasureMode: boolean; 
  setIsMeasureMode: (mode: boolean) => void; 
}

export const MapControls = ({
  onBack,
  showAllNodePopups,
  setShowAllNodePopups,
  showAllLinePopups,
  setShowAllLinePopups,
  showPowerLevels,
  setShowPowerLevels,
  onRotate,
  onZoomIn,
  onZoomOut,
  isMeasureMode,
  setIsMeasureMode,
}: MapControlsProps) => {
  return (
    <div className='absolute top-4 right-4 z-[1000] flex flex-col gap-2 no-print'>
      {/* Menu Controls */}
      <div className='flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'>
        {onBack && (
          <button
            onClick={onBack}
            className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors text-left font-medium'>
            ← Back
          </button>
        )}
        <button
          onClick={() => setShowAllNodePopups(!showAllNodePopups)}
          className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded transition-colors text-left'>
          <span className={`w-2 h-2 rounded-full ${showAllNodePopups ? 'bg-green-500' : 'bg-red-500'}`} />
          {showAllNodePopups ? 'Hide Node Info' : 'Show Node Info'}
        </button>
        <button
          onClick={() => setShowAllLinePopups(!showAllLinePopups)}
          className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded transition-colors text-left'>
          <span className={`w-2 h-2 rounded-full ${showAllLinePopups ? 'bg-green-500' : 'bg-red-500'}`} />
          {showAllLinePopups ? 'Hide Line Info' : 'Show Line Info'}
        </button>
        
        {/* NEW: Show Power Levels Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        <button
          onClick={() => setShowPowerLevels(!showPowerLevels)}
          className={`px-3 py-2 text-sm flex items-center justify-between rounded transition-colors text-left font-semibold ${
             showPowerLevels 
                ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}>
          <span className="flex items-center gap-2">
              <Zap size={14} className={showPowerLevels ? 'text-orange-500' : 'text-gray-400'} /> 
              Power Map
          </span>
          <span className={`w-2 h-2 rounded-full ${showPowerLevels ? 'bg-orange-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
        </button>
      </div>

      {/* Zoom, Measure & Rotation Controls */}
      <div className='flex gap-2 justify-end'>
        <div className='flex flex-col gap-px bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden justify-center'>
          <button
            onClick={() => setIsMeasureMode(!isMeasureMode)}
            className={`p-2 transition-colors ${
              isMeasureMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
            title='Measure Distance'>
            <Ruler size={18} />
          </button>
        </div>

        <div className='flex flex-col gap-px bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <button
            onClick={onZoomIn}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            title='Zoom In'>
            <Plus size={18} />
          </button>
          <div className='h-px bg-gray-200 dark:bg-gray-700' />
          <button
            onClick={onZoomOut}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            title='Zoom Out'>
            <Minus size={18} />
          </button>
        </div>

        <div className='flex gap-px bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <button
            onClick={() => onRotate(-90)}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            title='Rotate Left'>
            <RotateCcw size={18} />
          </button>
          <div className='w-px bg-gray-200 dark:bg-gray-700' />
          <button
            onClick={() => onRotate(90)}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            title='Rotate Right'>
            <RotateCw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};