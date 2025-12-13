// components/diary/DiaryEntryCard.tsx
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiUser, FiHash } from 'react-icons/fi';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { Button } from '@/components/common/ui';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { HtmlContent } from '@/components/common/ui/HtmlContent';

interface DiaryEntryCardProps {
  entry: Diary_notesRowSchema & { full_name?: string | null };
  onEdit: (entry: Diary_notesRowSchema) => void;
  onDelete: (entry: { id: string; name: string }) => void;
  // Separate permissions
  canEdit: boolean;
  canDelete: boolean;
}

export const DiaryEntryCard = ({ entry, onEdit, onDelete, canEdit, canDelete }: DiaryEntryCardProps) => {
  const { isSuperAdmin, role: currentUserRole } = useUser();
  const dateObj = new Date(entry.note_date!);
  
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const weekday = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 overflow-hidden flex flex-col h-full"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-center min-w-[50px]">
                <div className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">{weekday.substring(0, 3)}</div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200 leading-none">{dateObj.getDate()}</div>
            </div>
            <div>
                 <h3 className="text-base font-semibold text-gray-900 dark:text-white">{formattedDate}</h3>
                 {(isSuperAdmin || currentUserRole === UserRole.ADMIN) && entry.full_name && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <FiUser className="w-3 h-3" />
                        <span>{entry.full_name}</span>
                    </div>
                 )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button size="xs" variant="ghost" onClick={() => onEdit(entry)}>
                <FiEdit className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button 
                size="xs" 
                variant="ghost" 
                onClick={() => onDelete({ id: entry.id!, name: `Note from ${formattedDate}` })} 
                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="pl-2 border-l-2 border-gray-100 dark:border-gray-700 space-y-3">
          {/* Tags Section */}
          {entry.tags && entry.tags.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-2">
                {entry.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <FiHash className="w-2.5 h-2.5 mr-1 opacity-50" /> {tag}
                    </span>
                ))}
             </div>
          )}

          <HtmlContent content={entry.content} className="text-sm text-gray-700 dark:text-gray-300" />
        </div>
      </div>
    </motion.div>
  );
};