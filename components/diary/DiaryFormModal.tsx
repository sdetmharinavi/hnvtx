"use client"

// components/diary/DiaryFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diary_notesInsertSchema, Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { Modal } from '@/components/common/ui';
import { FormCard, FormDateInput, FormRichTextEditor } from '@/components/common/form'; // Changed FormTextarea to FormRichTextEditor
import { useEffect } from 'react';

interface DiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Diary_notesInsertSchema) => void;
  isLoading: boolean;
  editingNote?: Diary_notesInsertSchema | null;
  selectedDate?: Date;
}

export const DiaryFormModal = ({ isOpen, onClose, onSubmit, isLoading, editingNote, selectedDate }: DiaryFormModalProps) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Diary_notesInsertSchema>({
    resolver: zodResolver(diary_notesInsertSchema.pick({ note_date: true, content: true })),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        reset({
          note_date: editingNote.note_date,
          content: editingNote.content,
        });
      } else {
        const formatLocalYMD = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const base = selectedDate ? new Date(selectedDate.getTime()) : new Date();
        base.setHours(0, 0, 0, 0);
        const dateToSet = formatLocalYMD(base);
        reset({
          note_date: dateToSet,
          content: '',
        });
      }
    }
  }, [isOpen, editingNote, selectedDate, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingNote ? 'Edit Diary Note' : 'Add New Note'} className='w-0 h-0'>
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={editingNote ? 'Edit Diary Note' : 'Add New Note'}
        standalone
        widthClass="max-w-4xl" // Wider for WYSIWYG
      >
        <div className="space-y-4">
          <FormDateInput name="note_date" label="Note Date" control={control} error={errors.note_date} required pickerProps={{ readOnly: !editingNote }} />
          
          {/* Replaced Textarea with RichTextEditor */}
          <FormRichTextEditor 
            name="content" 
            label="Content" 
            control={control} 
            error={errors.content} 
            placeholder="Write your daily notes here..." 
          />
        </div>
      </FormCard>
    </Modal>
  );
};