import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import TruncateTooltip from './TruncateTooltip';

interface GenericRemarksProps {
  remark: string;
}

const GenericRemarks = ({ remark }: GenericRemarksProps) => {
  return remark ? (
    <div className="flex gap-2 items-start text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded w-full">
      <FiMessageSquare className="shrink-0 mt-0.5" />
      <TruncateTooltip className="truncate" text={remark} />
    </div>
  ) : null;
};

export default GenericRemarks;
