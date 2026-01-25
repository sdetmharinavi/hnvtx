// components/notes/NoteViewModal.tsx
'use client';

import { Modal } from '@/components/common/ui/Modal';
import { HtmlContent } from '@/components/common/ui/HtmlContent';
import { formatDate } from '@/utils/formatters';
import Image from 'next/image';
import { FiCalendar, FiTag, FiUser, FiPrinter } from 'react-icons/fi'; // Added FiPrinter
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_technical_notesRowSchema } from '@/schemas/zod-schemas';
import { Button } from '@/components/common/ui/Button'; // Added Button import

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: V_technical_notesRowSchema | null;
}

export const NoteViewModal = ({ isOpen, onClose, note }: NoteViewModalProps) => {
  if (!note) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note.title || ''} size='xl'>
      <div className='flex flex-col h-full'>
        {/* Printable Content Area */}
        <div className='space-y-6 p-2 printable-content bg-white dark:bg-transparent'>
          {/* Print-only Header (Optional, for context when printed) */}
          <div className='hidden print:block mb-4 border-b border-black pb-2'>
            <h1 className='text-2xl font-bold'>{note.title}</h1>
          </div>

          {/* Header Metadata */}
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center gap-3'>
              {note.author_avatar ? (
                <Image
                  src={note.author_avatar}
                  alt='Avatar'
                  width={40}
                  height={40}
                  className='rounded-full'
                />
              ) : (
                <div className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
                  <FiUser className='text-gray-500' />
                </div>
              )}
              <div>
                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                  {note.author_name || 'Unknown Author'}
                </p>
                <p className='text-xs text-gray-500'>{note.author_email}</p>
              </div>
            </div>

            <div className='flex flex-col items-end gap-1'>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                <FiCalendar />
                <span>{formatDate(note.created_at || new Date())}</span>
              </div>
              <div className='print:hidden'>
                <StatusBadge status={note.is_published ? 'Published' : 'Draft'} />
              </div>
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {note.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800 print:border-gray-300 print:bg-white print:text-black'
                >
                  <FiTag className='w-3 h-3' />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className='bg-white dark:bg-gray-800/50 rounded-lg p-1 print:bg-white print:p-0'>
            <HtmlContent content={note.content} className='prose-lg' />
          </div>
        </div>

        {/* Footer Actions (Hidden during print) */}
        <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 no-print'>
          <Button
            variant='outline'
            onClick={handlePrint}
            leftIcon={<FiPrinter className='w-4 h-4' />}
          >
            Print
          </Button>
          <Button variant='secondary' onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
