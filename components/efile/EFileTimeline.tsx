import React from 'react';
import { formatDate } from '@/utils/formatters';
import { ArrowDown, CheckCircle, Send, CornerUpLeft, FilePlus } from 'lucide-react';
import { EFileMovementRow } from '@/schemas/efile-schemas';
import TruncateTooltip from '../common/TruncateTooltip';

interface Props {
  history: EFileMovementRow[];
}

export const EFileTimeline: React.FC<Props> = ({ history }) => {
  const getIcon = (action: string) => {
    switch (action) {
      case 'initiated': return <FilePlus className="w-4 h-4 text-blue-600" />;
      case 'forwarded': return <Send className="w-4 h-4 text-indigo-600" />;
      case 'returned': return <CornerUpLeft className="w-4 h-4 text-orange-600" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <ArrowDown className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-8">
      {history.map((move) => (
        <div key={move.id} className="relative">
          <div className="absolute -left-[25px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-full shadow-sm">
            {getIcon(move.action_type)}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mb-1">
                        {move.action_type}
                    </span>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                        {move.from_employee_name && (
                            <>
                                <span className="font-medium text-gray-600 dark:text-gray-400">{move.from_employee_name}</span>
                                <span className="text-gray-400">→</span>
                            </>
                        )}
                        <span className="font-bold text-gray-900 dark:text-white">{move.to_employee_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border dark:border-gray-700">
                            {move.to_employee_designation || 'Employee'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className="text-xs text-gray-500 whitespace-nowrap font-mono">
                        {formatDate(move.created_at, { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {move.performed_by_name && (
                        <span className="text-[10px] text-gray-400">
                            Op: {move.performed_by_name}
                        </span>
                    )}
                </div>
            </div>
            {move.remarks && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded border-l-2 border-blue-300 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-300 italic">
                    "<TruncateTooltip text={move.remarks} className='inline' />"
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};