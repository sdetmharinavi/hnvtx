// components/map/MeshDiagram/MeshControls.tsx
'use client';

import { ArrowLeft, Maximize, Minimize, Zap } from 'lucide-react';

interface MeshControlsProps {
  onBack?: () => void;
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
  showPowerLevels: boolean;
  setShowPowerLevels: (show: boolean) => void;
}

export const MeshControls = ({ onBack, isFullScreen, setIsFullScreen, showPowerLevels, setShowPowerLevels }: MeshControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 flex flex-col p-1.5 gap-1.5">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center group"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
          title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

        <button
          onClick={() => setShowPowerLevels(!showPowerLevels)}
          className={`p-2 rounded transition-colors flex items-center justify-center ${
            showPowerLevels 
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' 
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title="Toggle Power Map"
        >
          <Zap className={`h-5 w-5 ${showPowerLevels ? 'animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
};