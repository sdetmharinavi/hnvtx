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
  selectedDate?: Date; // New prop for pre-filling date
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
        // Pre-fill with the selected date from the calendar
        const dateToSet = selectedDate ? new Date(selectedDate.setHours(0,0,0,0)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        reset({
          note_date: dateToSet,
          content: '',
        });
      }
    }
  }, [isOpen, editingNote, selectedDate, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingNote ? 'Edit Diary Note' : 'Add New Note'} size="lg">
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={editingNote ? 'Edit Diary Note' : 'Add New Note'}
        standalone={false}
      >
        <div className="space-y-4">
          <FormDateInput name="note_date" label="Note Date" control={control} error={errors.note_date} required pickerProps={{ readOnly: !editingNote }} />
          <FormTextarea name="content" label="Content" control={control} error={errors.content} rows={8} placeholder="Write your daily notes here..." />
        </div>
      </FormCard>
    </Modal>
  );
};