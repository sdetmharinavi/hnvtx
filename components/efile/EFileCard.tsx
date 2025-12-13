// components/efile/EFileCard.tsx
import React from 'react';
import { V_e_files_extendedRowSchema } from '@/schemas/zod-schemas';
import { FiSend, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { formatDate } from '@/utils/formatters';

interface EFileCardProps {
  file: V_e_files_extendedRowSchema;
  onView: (file: V_e_files_extendedRowSchema) => void;
  onForward: (file: V_e_files_extendedRowSchema) => void;
  onEdit?: (file: V_e_files_extendedRowSchema) => void;
  onDelete?: (file: V_e_files_extendedRowSchema) => void;
  // THE FIX: Split permissions
  canEdit: boolean;
  canDelete: boolean;
}

export const EFileCard: React.FC<EFileCardProps> = ({
  file, onView, onForward, onEdit, onDelete, canEdit, canDelete
}) => {
  
  // Visual Logic
  const getPriorityColor = (p: string | null) => {
    switch(p) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    }
  };

  const isClosed = file.status === 'closed';

  return (
    <div 
      onClick={() => onView(file)}
      className={`
        relative flex flex-col h-full rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer group
        ${isClosed 
            ? 'bg-gray-50 border-gray-200 opacity-75 dark:bg-gray-800/50 dark:border-gray-700' 
            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 mb-1">
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(file.priority)}`}>
                    {file.priority}
                 </span>
                 {isClosed && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Closed</span>}
             </div>
             <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate" title={file.file_number || ''}>
                {file.file_number}
             </h3>
        </div>
        <div className="shrink-0 text-right">
             <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {file.updated_at ? formatDate(file.updated_at, { format: 'dd-mm-yyyy' }) : '-'}
             </div>
             <div className="text-[10px] text-gray-400 uppercase">Last Update</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 space-y-3">
         <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2" title={file.subject || ''}>
                {file.subject}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                {file.description || 'No description provided.'}
            </p>
         </div>

         <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
             <span className="font-semibold text-[10px] uppercase text-gray-400">Category:</span>
             <span>{file.category}</span>
         </div>
      </div>

      {/* Footer: Holder Info */}
      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800/30 rounded-b-xl">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isClosed ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'}`}>
                  {file.current_holder_name?.charAt(0) || '?'}
               </div>
               <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                      {file.current_holder_name}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                      {file.current_holder_designation || 'Unknown'}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
               {!isClosed && (
                 <Button size="xs" variant="primary" onClick={() => onForward(file)} title="Forward File" className="shadow-sm">
                    <FiSend className="w-3.5 h-3.5" />
                 </Button>
               )}
               {/* Show Edit if allowed */}
               {canEdit && !isClosed && onEdit && (
                 <Button size="xs" variant="ghost" onClick={() => onEdit(file)} title="Edit Details">
                    <FiEdit2 className="w-3.5 h-3.5" />
                 </Button>
               )}
               {/* Show Delete only if Super Admin */}
               {canDelete && onDelete && (
                 <Button size="xs" variant="ghost" onClick={() => onDelete(file)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <FiTrash2 className="w-3.5 h-3.5" />
                 </Button>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};