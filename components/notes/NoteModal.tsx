'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormRichTextEditor, FormSwitch } from '@/components/common/form';
import { useEffect } from 'react';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
// import { useUser } from '@/providers/UserProvider';
import { Input } from '@/components/common/ui';
import { technical_notesInsertSchema, Technical_notesInsertSchema, V_technical_notesRowSchema } from '@/schemas/zod-schemas';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Technical_notesInsertSchema) => void;
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
  // const { user } = useUser(); // To auto-assign author if needed (though backend usually handles it)

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
  
  // Helper to handle comma-separated tags input
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val.trim() === "") {
          setValue('tags', []);
          return;
      }
      const tags = val.split(',').map(t => t.trim());
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
          // Keep ID out of insert schema, handled by update logic in hook
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

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Technical Note"
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
      size="xl"
      heightClass="h-auto"
    >
      <div className="space-y-4">
        <FormInput
          name="title"
          label="Title"
          register={register}
          error={errors.title}
          placeholder="e.g. Fiber Splicing Best Practices"
          required
        />
        
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
            <Input 
                placeholder="network, fiber, maintenance"
                value={tagsValue.join(', ')}
                onChange={handleTagsChange}
            />
        </div>

        <FormRichTextEditor
          name="content"
          label="Content"
          control={control}
          error={errors.content}
          placeholder="Write your note here..."
        />
        
        <FormSwitch 
            name="is_published"
            label="Publish Immediately"
            control={control}
            description="If unchecked, this will be saved as a draft."
        />
      </div>
    </BaseFormModal>
  );
};