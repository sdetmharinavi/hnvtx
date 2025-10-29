// components/diary/DiaryEntryCard.tsx
import { motion } from 'framer-motion';
import { FiCalendar, FiEdit, FiTrash2, FiUser } from 'react-icons/fi';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { Button } from '@/components/common/ui';
import { useUser } from '@/providers/UserProvider';

interface DiaryEntryCardProps {
  entry: Diary_notesRowSchema & { full_name?: string | null }; // Allow full_name for admins
  onEdit: (entry: Diary_notesRowSchema) => void;
  onDelete: (entry: { id: string; name: string }) => void;
}

export const DiaryEntryCard = ({ entry, onEdit, onDelete }: DiaryEntryCardProps) => {
  const { isSuperAdmin } = useUser();
  const formattedDate = new Date(entry.note_date!).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <FiCalendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formattedDate}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(entry)}><FiEdit className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete({ id: entry.id!, name: `Note from ${formattedDate}` })} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
              <FiTrash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isSuperAdmin && entry.full_name && (
          <div className="flex items-center gap-2 mt-2 pl-8 text-sm text-gray-500 dark:text-gray-400">
            <FiUser className="w-4 h-4" />
            <span>{entry.full_name}</span>
          </div>
        )}

        <div className="mt-4 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.content}</p>
        </div>
      </div>
    </motion.div>
  );
};