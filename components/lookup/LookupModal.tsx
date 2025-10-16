// path: components/lookup/LookupModal.tsx
"use client";

import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { lookup_typesInsertSchema, Lookup_typesInsertSchema, Lookup_typesRowSchema, Lookup_typesUpdateSchema } from "@/schemas/zod-schemas";
import { snakeToTitleCase } from "@/utils/formatters";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { generateCodeFromName } from "@/config/helper-functions";

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookupCreated?: (lookupData: Lookup_typesInsertSchema) => void;
  onLookupUpdated?: (lookupData: Lookup_typesUpdateSchema) => void;
  editingLookup?: Lookup_typesUpdateSchema | null;
  category?: string;
  categories?: Lookup_typesRowSchema[];
}

const getUniqueCategories = (data?: Lookup_typesRowSchema[]) => {
  if (!data) return [];
  const categoriesSet = new Set<string>();
  data.forEach(item => {
    if (item.category) {
      categoriesSet.add(item.category);
    }
  });
  return Array.from(categoriesSet).sort();
};

export function LookupModal({
  isOpen,
  onClose,
  onLookupCreated,
  onLookupUpdated,
  editingLookup,
  category,
  categories,
}: LookupModalProps) {
  const supabase = createClient();
  const { mutate: createLookup } = useTableInsert(supabase, "lookup_types");
  const { mutate: updateLookup } = useTableUpdate(supabase, "lookup_types");

  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const isEditMode = Boolean(editingLookup);
  const uniqueCategories = getUniqueCategories(categories);

  const lookupTypeFormSchema = lookup_typesInsertSchema.pick({
    category: true, code: true, description: true, name: true,
    sort_order: true, is_system_default: true, status: true,
    is_ring_based: true,
  });
  type LookupTypeFormData = z.infer<typeof lookupTypeFormSchema>;

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
    reset, watch, setValue,
  } = useForm<LookupTypeFormData>({
    resolver: zodResolver(lookupTypeFormSchema),
    defaultValues: {
      category: "", code: "", description: "", name: "",
      sort_order: 0, is_system_default: false, status: true,
      is_ring_based: false, 
    },
  });
  
  const watchedName = watch('name');
  const watchedCategory = watch("category");

  useEffect(() => {
    if (isOpen) {
      setIsCodeManuallyEdited(isEditMode);
      const resetData: LookupTypeFormData = {
        category: editingLookup?.category || category || "",
        code: editingLookup?.code || "",
        description: editingLookup?.description || "",
        name: editingLookup?.name || "",
        sort_order: editingLookup?.sort_order || 0,
        is_system_default: editingLookup?.is_system_default || false,
        status: editingLookup?.status !== false,
        is_ring_based: editingLookup?.is_ring_based || false, // ADDED
      };
      reset(resetData);
    }
  }, [isOpen, editingLookup, category, reset, isEditMode]);

  useEffect(() => {
    if (!isCodeManuallyEdited && !isEditMode) {
      const generatedCode = generateCodeFromName(watchedName);
      setValue('code', generatedCode, { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, isEditMode, setValue]);

  const onValidSubmit = useCallback(
    (data: LookupTypeFormData) => {
      const submissionData = { ...data, code: data.code?.trim() || null, description: data.description?.trim() || null, name: data.name?.trim(), category: data.category?.trim(), };
      if (isEditMode && editingLookup?.id) {
        updateLookup({ id: editingLookup.id, data: submissionData }, {
          onSuccess: (updatedData) => { onLookupUpdated?.(updatedData as Lookup_typesUpdateSchema); onClose(); },
          onError: (error) => toast.error(`Failed to update lookup type: ${error.message}`),
        });
      } else {
        createLookup(submissionData, {
          onSuccess: (createdData) => { onLookupCreated?.(createdData as unknown as Lookup_typesInsertSchema); onClose(); },
          onError: (error) => toast.error(`Failed to create lookup type: ${error.message}`),
        });
      }
    },
    [isEditMode, editingLookup, updateLookup, createLookup, onLookupUpdated, onLookupCreated, onClose]
  );

  const modalTitle = isEditMode ? "Edit Lookup Type" : "Add Lookup Type";
  const submitButtonText = isEditMode ? (isSubmitting ? "Updating..." : "Update") : (isSubmitting ? "Creating..." : "Create");
  const canSubmit = Boolean(watch("category")?.trim() && watch("name")?.trim() && !isSubmitting);
  const watchedCode = watch("code");

  // Determine if the special system type flags should be shown
  const showSystemFlags = watchedCategory === 'SYSTEM_TYPES';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} visible={false} className="transparent bg-gray-700 rounded-2xl">
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-red-500 dark:text-red-400">*</span></label>
            {isEditMode || category ? (
              <Input type="text" {...register("category")} readOnly className="bg-gray-50 dark:bg-gray-700" value={watchedCategory || ""} />
            ) : (
              <select {...register("category")} className="w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none border-gray-300 dark:border-gray-600" disabled={isSubmitting} value={watchedCategory || ""} onChange={(e) => setValue("category", e.target.value)}>
                <option value="">Select category...</option>
                {uniqueCategories.map((cat) => (<option key={cat} value={cat}>{snakeToTitleCase(cat)}</option>))}
              </select>
            )}
            {errors.category && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.category.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500 dark:text-red-400">*</span></label>
            <Input type="text" {...register("name")} placeholder="Enter lookup name" disabled={isSubmitting} className="dark:bg-gray-800" />
            {errors.name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
            <Input
              type="text"
              id="code"
              {...register("code")}
              placeholder="Auto-generated or manual"
              value={watchedCode || ""}
              disabled={isSubmitting}
              onChange={(e) => {
                setIsCodeManuallyEdited(true);
                setValue("code", e.target.value);
              }}
              className="dark:bg-gray-800"
            />
            {errors.code && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="sort_order" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
            <Input type="number" id="sort_order" {...register("sort_order", { valueAsNumber: true })} placeholder="0" disabled={isSubmitting} min="0" className="dark:bg-gray-800" />
            {errors.sort_order && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.sort_order.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea className="w-full rounded-md border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2" rows={3} {...register("description")} placeholder="Enter description (optional)" disabled={isSubmitting} />
            {errors.description && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.description.message}</p>}
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <input type="checkbox" id="status" {...register("status")} disabled={isSubmitting} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600" />
              <label htmlFor="status" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Status</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="is_system_default" {...register("is_system_default")} disabled={isSubmitting || (isEditMode && !!editingLookup?.is_system_default)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600" />
              <label htmlFor="is_system_default" className="ml-2 text-sm text-gray-700 dark:text-gray-300">System Default (Cannot be deleted)</label>
            </div>

            {/* ADDED: Conditional rendering for system type flags */}
            {showSystemFlags && (
              <>
                <div className="flex items-center">
                  <input type="checkbox" id="is_ring_based" {...register("is_ring_based")} disabled={isSubmitting} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600" />
                  <label htmlFor="is_ring_based" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Is Ring-Based System</label>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={!canSubmit}>{submitButtonText}</Button>
        </div>
      </form>
    </Modal>
  );
}