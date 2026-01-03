"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { diary_notesInsertSchema, Diary_notesInsertSchema } from "@/schemas/zod-schemas";
import { Modal } from "@/components/common/ui";
import { FormCard, FormDateInput, FormRichTextEditor, FormInput } from "@/components/common/form";
import { useCallback, useEffect } from "react";
import { z } from "zod";

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
    content: z.string().max(500000, "Note is too long").nullable().optional(),
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
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isDirty }, // Extract isDirty
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
  });

  // --- THE FIX: Intercept Close Action ---
  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmClose) return;
    }
    onClose();
  }, [isDirty, onClose]);

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
    const tagString = data.tagString || "";
    const tags = tagString
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    onSubmit({
      note_date: data.note_date,
      content: data.content,
      tags,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose} // Use handleClose wrapper
      title={editingNote ? "Edit Diary Note" : "Add New Note"}
      className='w-0 h-0 bg-transparent'
      closeOnOverlayClick={false} // Prevent accidental clicks outside
    >
      <FormCard
        onSubmit={handleSubmit(onFormSubmit)}
        onCancel={handleClose} // Use handleClose wrapper
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
      </FormCard>
    </Modal>
  );
};
