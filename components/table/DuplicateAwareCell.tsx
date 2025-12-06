// components/table/DuplicateAwareCell.tsx
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
         <div 
            className="shrink-0 cursor-help" 
            title="Duplicate Entry: This name appears multiple times in the list."
         >
            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
         </div>
      )}
    </div>
  );
};