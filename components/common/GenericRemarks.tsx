import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import TruncateTooltip from './TruncateTooltip';

interface GenericRemarksProps {
  remark: string;
  maxLines?: number;
  renderAsHtml?: boolean;
}

const GenericRemarks = ({ remark, maxLines = 2, renderAsHtml = true }: GenericRemarksProps) => {
  if (!remark) return null;

  return (
    <div
      className='flex gap-2 items-start text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800/30 w-full'
      role='note'
      aria-label='Remark'
    >
      <FiMessageSquare className='shrink-0 mt-[2px]' aria-hidden='true' size={14} />
      <TruncateTooltip
        text={remark}
        expandable={true}
        maxLines={maxLines}
        renderAsHtml={renderAsHtml}
        className='flex-1'
      />
    </div>
  );
};

export default GenericRemarks;
