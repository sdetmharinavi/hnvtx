// components/common/ui/table/DuplicateAwareCell.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface DuplicateAwareCellProps {
  text: string | null | undefined;
  isDuplicate?: boolean;
  className?: string;
}

export const DuplicateAwareCell: React.FC<DuplicateAwareCellProps> = ({ 
  text, 
  isDuplicate = false,
  className = ''
}) => {
  const strValue = String(text ?? '');

  return (
    <div className={`flex items-center gap-2 max-w-full ${className}`}>
      <TruncateTooltip 
        text={strValue} 
        className={`font-medium ${isDuplicate ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-900 dark:text-white'}`} 
      />
      
      {isDuplicate && (
         <div className="shrink-0 group relative cursor-help">
            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
            {/* Custom Tooltip for the Icon */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
              Duplicate Entry
              <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
              </svg>
            </span>
         </div>
      )}
    </div>
  );
};