// components/diary/DiaryFormModal.tsx
'use client';

import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diary_notesInsertSchema, Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { FormDateInput, FormRichTextEditor, FormInput } from '@/components/common/form';
import { useEffect } from 'react';
import { z } from 'zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';

interface DiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Diary_notesInsertSchema) => void;
  isLoading: boolean;
  editingNote?: Diary_notesInsertSchema | null;
  selectedDate?: Date;
}

const diaryFormSchema = diary_notesInsertSchema
  .pick({ note_date: true, content: true, tags: true })
  .extend({
    tagString: z.string().optional(),
    content: z.string().max(500000, 'Note is too long').nullable().optional(),
  });

type DiaryFormValues = z.infer<typeof diaryFormSchema>;

export const DiaryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingNote,
  selectedDate,
}: DiaryFormModalProps) => {
  const isEditMode = !!editingNote;

  const form = useForm<DiaryFormValues>({
    // FIX: Explicit cast for strict type safety
    resolver: zodResolver(diaryFormSchema) as unknown as Resolver<DiaryFormValues>,
    defaultValues: {
      note_date: '',
      content: '',
      tags: [],
      tagString: '',
    },
  });

  const {
    control,
    reset,
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        reset({
          note_date: editingNote.note_date,
          content: editingNote.content,
          tags: editingNote.tags || [],
          tagString: editingNote.tags?.join(', ') || '',
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
          tags: [],
          tagString: '',
        });
      }
    }
  }, [isOpen, editingNote, selectedDate, reset]);

  const onFormSubmit = (data: DiaryFormValues) => {
    const tagString = data.tagString || '';
    const tags = tagString
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    onSubmit({
      note_date: data.note_date,
      content: data.content,
      tags,
    });
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Diary Note"
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onFormSubmit}
      heightClass="h-auto"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormDateInput
            name="note_date"
            label="Note Date"
            control={control}
            error={errors.note_date}
            required
            // Only allow date editing if creating a new note (optional logic, can be removed to allow moving notes)
            pickerProps={{ readOnly: false }}
          />
          <FormInput
            name="tagString"
            label="Tags"
            register={register}
            placeholder="e.g. maintenance, critical, fiber cut"
            error={errors.tagString}
          />
        </div>

        <FormRichTextEditor
          name="content"
          label="Content"
          control={control}
          error={errors.content}
          placeholder="Write your daily notes here..."
        />
      </div>
    </BaseFormModal>
  );
};
