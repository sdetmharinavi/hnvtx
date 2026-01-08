'use client';

import { ArrowLeft, Maximize, Minimize } from 'lucide-react';

interface MeshControlsProps {
  onBack?: () => void;
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
}

export const MeshControls = ({ onBack, isFullScreen, setIsFullScreen }: MeshControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
          title="Go Back"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
        </button>
      )}

      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
        title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>
    </div>
  );
};
