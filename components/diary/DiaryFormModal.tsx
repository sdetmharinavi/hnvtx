// components/diary/DiaryFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diary_notesInsertSchema, Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { Modal } from '@/components/common/ui';
import { FormCard, FormDateInput, FormTextarea } from '@/components/common/form';
import { useEffect } from 'react';

interface DiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Diary_notesInsertSchema) => void;
  isLoading: boolean;
  editingNote?: Diary_notesInsertSchema | null;
}

export const DiaryFormModal = ({ isOpen, onClose, onSubmit, isLoading, editingNote }: DiaryFormModalProps) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<Diary_notesInsertSchema>({
    resolver: zodResolver(diary_notesInsertSchema.pick({ note_date: true, content: true })),
    defaultValues: {
      note_date: new Date().toISOString().split('T')[0],
      content: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        reset({
          note_date: editingNote.note_date,
          content: editingNote.content,
        });
      } else {
        reset({
          note_date: new Date().toISOString().split('T')[0],
          content: '',
        });
      }
    }
  }, [isOpen, editingNote, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingNote ? 'Edit Diary Note' : 'Add New Note'} className='w-0 h-0'>
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={editingNote ? 'Edit Diary Note' : 'Add New Note'}
        standalone
      >
        <div className="space-y-4">
          <FormDateInput name="note_date" label="Note Date" control={control} error={errors.note_date} required />
          <FormTextarea name="content" label="Content" control={control} error={errors.content} rows={8} placeholder="Write your daily notes here..." />
        </div>
      </FormCard>
    </Modal>
  );
};