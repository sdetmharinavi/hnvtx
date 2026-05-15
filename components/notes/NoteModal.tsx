// components/notes/NoteModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormRichTextEditor, FormSwitch } from '@/components/common/form';
import { useEffect } from 'react';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { Input, Button } from '@/components/common/ui'; // IMPORT BUTTON
import {
  technical_notesInsertSchema,
  Technical_notesInsertSchema,
  V_technical_notesRowSchema,
} from '@/schemas/zod-schemas';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Technical_notesInsertSchema, options?: { keepOpen?: boolean }) => void;
  isLoading: boolean;
  editingNote?: V_technical_notesRowSchema | null;
}

export const NoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingNote,
}: NoteModalProps) => {
  const isEditMode = !!editingNote;

  const form = useForm<Technical_notesInsertSchema>({
    resolver: zodResolver(technical_notesInsertSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: [],
      is_published: false,
    },
  });

  const {
    control,
    reset,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const tagsValue = watch('tags') || [];

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.trim() === '') {
      setValue('tags', []);
      return;
    }
    const tags = val.split(',').map((t) => t.trim());
    setValue('tags', tags);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        reset({
          title: editingNote.title || '',
          content: editingNote.content,
          tags: editingNote.tags || [],
          is_published: editingNote.is_published ?? false,
        });
      } else {
        reset({
          title: '',
          content: '',
          tags: [],
          is_published: false,
        });
      }
    }
  }, [isOpen, editingNote, reset]);

  const onStandardSubmit = (data: Technical_notesInsertSchema) => {
    onSubmit(data, { keepOpen: false });
  };

  const handleSaveAndContinue = form.handleSubmit((data) => {
    onSubmit(data, { keepOpen: true });
  });

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
      <Button
        type='submit'
        variant='primary'
        disabled={isLoading}
        onClick={form.handleSubmit(onStandardSubmit)}>
        {isLoading ? 'Saving...' : 'Save & Close'}
      </Button>
    </div>
  );

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Technical Note'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onStandardSubmit}
      size='xl'
      heightClass='h-auto'
      footerContent={customFooter}>
      <div className='space-y-4'>
        <FormInput
          name='title'
          label='Title'
          register={register}
          error={errors.title}
          placeholder='e.g. Fiber Splicing Best Practices'
          required
        />

        <div className='space-y-2'>
          <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Tags (comma separated)
          </label>
          <Input
            placeholder='network, fiber, maintenance'
            value={tagsValue.join(', ')}
            onChange={handleTagsChange}
          />
        </div>

        <FormRichTextEditor
          name='content'
          label='Content'
          control={control}
          error={errors.content}
          placeholder='Write your note here...'
        />

        <FormSwitch
          name='is_published'
          label='Publish Immediately'
          control={control}
          description='If unchecked, this will be saved as a draft.'
        />
      </div>
    </BaseFormModal>
  );
};
