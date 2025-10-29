// components/diary/DiaryEntryCard.tsx
import { motion } from 'framer-motion';
import { FiCalendar, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Diary_notesRowSchema } from '@/schemas/zod-schemas';
import { Button } from '@/components/common/ui';

interface DiaryEntryCardProps {
  entry: Diary_notesRowSchema;
  onEdit: (entry: Diary_notesRowSchema) => void;
  onDelete: (entry: { id: string; name: string }) => void;
}

export const DiaryEntryCard = ({ entry, onEdit, onDelete }: DiaryEntryCardProps) => {
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
        <div className="mt-4 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.content}</p>
        </div>
      </div>
    </motion.div>
  );
};