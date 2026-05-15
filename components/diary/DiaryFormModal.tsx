// components/diary/DiaryFormModal.tsx
'use client';

import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diary_notesInsertSchema, Diary_notesInsertSchema } from '@/schemas/zod-schemas';
import { FormDateInput, FormRichTextEditor, FormInput } from '@/components/common/form';
import { useEffect } from 'react';
import { z } from 'zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { Button } from '@/components/common/ui'; // IMPORT BUTTON

interface DiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Diary_notesInsertSchema, keepOpen?: boolean) => void;
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

  const onFormSubmit = (data: DiaryFormValues, keepOpen: boolean = false) => {
    const tagString = data.tagString || '';
    const tags = tagString
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    onSubmit(
      {
        note_date: data.note_date,
        content: data.content,
        tags,
      },
      keepOpen,
    );
  };

  const handleSaveAndContinue = form.handleSubmit((data) => {
    onFormSubmit(data, true);
  });

  // Custom footer implementation for Save & Continue
  const customFooter = (
    <div className='flex justify-end gap-2 w-full flex-wrap sm:flex-nowrap'>
      <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        type='button'
        variant='secondary'
        onClick={handleSaveAndContinue}
        disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save & Continue'}
      </Button>
      {/* Type="submit" utilizes the default form binding provided by BaseFormModal */}
      <Button
        type='submit'
        variant='primary'
        disabled={isLoading}
        onClick={form.handleSubmit((d) => onFormSubmit(d, false))}>
        {isLoading ? 'Saving...' : 'Save & Close'}
      </Button>
    </div>
  );

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Diary Note'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={(data) => onFormSubmit(data, false)}
      heightClass='h-auto'
      footerContent={customFooter}>
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormDateInput
            name='note_date'
            label='Note Date'
            control={control}
            error={errors.note_date}
            required
            pickerProps={{ readOnly: false }}
          />
          <FormInput
            name='tagString'
            label='Tags'
            register={register}
            placeholder='e.g. maintenance, critical, fiber cut'
            error={errors.tagString}
          />
        </div>

        <FormRichTextEditor
          name='content'
          label='Content'
          control={control}
          error={errors.content}
          placeholder='Write your daily notes here...'
        />
      </div>
    </BaseFormModal>
  );
};
