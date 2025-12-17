"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { diary_notesInsertSchema, Diary_notesInsertSchema } from "@/schemas/zod-schemas";
import { Modal } from "@/components/common/ui";
import { FormCard, FormDateInput, FormRichTextEditor, FormInput } from "@/components/common/form";
import { useEffect } from "react";
import { z } from "zod";

interface DiaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Diary_notesInsertSchema) => void;
  isLoading: boolean;
  editingNote?: Diary_notesInsertSchema | null;
  selectedDate?: Date;
}

// 1. Define a specific schema for this form that includes the UI-only 'tagString' field
const diaryFormSchema = diary_notesInsertSchema
  .pick({ note_date: true, content: true, tags: true })
  .extend({
    tagString: z.string().optional(), // Add validation for the helper field
  });

// 2. Infer the type from this new schema
type DiaryFormValues = z.infer<typeof diaryFormSchema>;

export const DiaryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingNote,
  selectedDate,
}: DiaryFormModalProps) => {
  // 3. Use the inferred type and the extended schema
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        reset({
          note_date: editingNote.note_date,
          content: editingNote.content,
          tags: editingNote.tags || [],
          tagString: editingNote.tags?.join(", ") || "",
        });
      } else {
        const formatLocalYMD = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };
        const base = selectedDate ? new Date(selectedDate.getTime()) : new Date();
        base.setHours(0, 0, 0, 0);
        const dateToSet = formatLocalYMD(base);
        reset({
          note_date: dateToSet,
          content: "",
          tags: [],
          tagString: "",
        });
      }
    }
  }, [isOpen, editingNote, selectedDate, reset]);

  const onFormSubmit = (data: DiaryFormValues) => {
    // Convert comma string to array
    const tagString = data.tagString || "";
    const tags = tagString
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    // Construct the payload for the API
    onSubmit({
      note_date: data.note_date,
      content: data.content,
      tags,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingNote ? "Edit Diary Note" : "Add New Note"}
      className='w-0 h-0'>
      <FormCard
        onSubmit={handleSubmit(onFormSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={editingNote ? "Edit Diary Note" : "Add New Note"}
        standalone>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormDateInput
              name='note_date'
              label='Note Date'
              control={control}
              error={errors.note_date}
              required
              pickerProps={{ readOnly: !editingNote }}
            />
            <FormInput
              name='tagString'
              label='Tags'
              register={register}
              placeholder='e.g. maintenance, critical, fiber cut'
              // Pass the error if tagString validation fails
              error={errors.tagString}
            />
          </div>

          <FormRichTextEditor
            name='content'
            label='Content'
            control={control}
            error={errors.content}
            placeholder='Write your daily notes here...'
            className="w-full h-full"
          />
        </div>
      </FormCard>
    </Modal>
  );
};
