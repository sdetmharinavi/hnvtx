import React from 'react';
import { formatDate } from '@/utils/formatters';
import { ArrowDown, CheckCircle, Send, CornerUpLeft, FilePlus } from 'lucide-react';
import { EFileMovementRow } from '@/schemas/efile-schemas';

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
        <div key={move.id} className="relative group">
          <div className="absolute -left-[25px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-full shadow-sm z-10 group-hover:scale-110 transition-transform">
            {getIcon(move.action_type)}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {move.action_type}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                            {formatDate(move.created_at, { format: 'dd-mm-yyyy', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {move.from_employee_name && (
                            <>
                                <span className="font-medium text-gray-600 dark:text-gray-400">{move.from_employee_name}</span>
                                <span className="text-gray-400">→</span>
                            </>
                        )}
                        <span className="font-bold text-gray-900 dark:text-white truncate max-w-full">
                            {move.to_employee_name}
                        </span>
                        {move.to_employee_designation && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded border dark:border-gray-700 whitespace-nowrap">
                                {move.to_employee_designation}
                            </span>
                        )}
                    </div>
                </div>

                {move.performed_by_name && (
                    <div className="shrink-0 text-right">
                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-full border dark:border-gray-700">
                            Op: {move.performed_by_name.split(' ')[0]}
                        </span>
                    </div>
                )}
            </div>
            
            {move.remarks && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-l-2 border-blue-300 dark:border-blue-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap wrap-break-word leading-relaxed">
                        &quot;{move.remarks}&quot;
                    </p>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};