// path: components/common/ui/FontSizeToggle.tsx
'use client';
import { useAppearanceStore } from '@/stores/appearanceStore';
import { ZoomIn, ZoomOut } from 'lucide-react';

export function FontSizeToggle() {
  const { fontSizeMultiplier, increase, decrease, reset } = useAppearanceStore();
  const percentage = Math.round(fontSizeMultiplier * 100);

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
      <button 
        onClick={decrease} 
        disabled={percentage <= 80} 
        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        aria-label="Decrease font size"
      >
        <ZoomOut size={16} />
      </button>
      <span
        onClick={reset}
        className="text-xs font-semibold w-12 text-center cursor-pointer tabular-nums"
        title="Reset Font Size"
      >
        {percentage}%
      </span>
      <button 
        onClick={increase} 
        disabled={percentage >= 150} 
        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        aria-label="Increase font size"
      >
        <ZoomIn size={16} />
      </button>
    </div>
  );
}