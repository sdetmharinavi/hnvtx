// path: components/categories/CategoryModal.tsx
"use client";

import { GroupedLookupsByCategory } from "@/components/categories/categories-types";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { Lookup_typesInsertSchema, lookup_typesInsertSchema, Lookup_typesRowSchema } from "@/schemas/zod-schemas";
import { snakeToTitleCase } from "@/utils/formatters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { generateCodeFromName } from "@/config/helper-functions";
import { FormCard } from "@/components/common/form";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Lookup_typesInsertSchema, isEditing: boolean) => void;
  isLoading: boolean;
  editingCategory?: string | null;
  categories?: Lookup_typesRowSchema[];
  lookupsByCategory?: GroupedLookupsByCategory;
}

const categoryFormSchema = lookup_typesInsertSchema.pick({
  category: true,
  code: true,
  description: true,
  name: true,
  sort_order: true,
  is_system_default: true,
  status: true,
  is_ring_based: true,
});
type CategoryForm = z.infer<typeof categoryFormSchema>;

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingCategory,
  lookupsByCategory,
}: CategoryModalProps) {
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const isEditMode = !!editingCategory;

  const {
    register, handleSubmit, formState: { errors },
    reset, watch, setValue,
  } = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      category: "", code: "default", description: "", name: "DEFAULT",
      sort_order: 0, is_system_default: true, status: true,
      is_ring_based: false,
    },
  });

  const watchedName = watch('name');

  useEffect(() => {
    if (isOpen) {
      setIsCodeManuallyEdited(isEditMode);
      if (editingCategory && lookupsByCategory) {
        const template = lookupsByCategory[editingCategory]?.[0];
        if (template) {
          reset({
            category: template.category,
            code: template.code || "default", description: template.description || "",
            name: template.name || "DEFAULT", sort_order: template.sort_order || 0,
            is_system_default: template.is_system_default ?? true,
            status: template.status ?? true, is_ring_based: template.is_ring_based || false,
          });
        }
      } else {
        reset({
          category: "", code: "default", description: "", name: "DEFAULT",
          sort_order: 0, is_system_default: true, status: true,
          is_ring_based: false,
        });
      }
    }
  }, [isOpen, editingCategory, lookupsByCategory, reset, isEditMode]);

  useEffect(() => {
    if (!isCodeManuallyEdited && !isEditMode) {
      setValue('code', generateCodeFromName(watchedName), { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, isEditMode, setValue]);

  const onValidSubmit = useCallback(
    (data: CategoryForm) => {
      const submissionData = {
        ...data,
        category: data.category.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, ""),
        description: `Default entry for ${snakeToTitleCase(data.category)} category`,
      };
      onSubmit(submissionData, isEditMode);
    },
    [onSubmit, isEditMode]
  );

  const modalTitle = isEditMode ? "Edit Category" : "Create New Category";
  const submitButtonText = isEditMode ? (isLoading ? "Updating..." : "Update") : (isLoading ? "Creating..." : "Create");
  const canSubmit = Boolean(watch("category")?.trim() && !isLoading);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} visible={false} className="transparent w-0 h-0">
      <FormCard isLoading={isLoading} standalone title={isEditMode ? "Edit Category" : "Add Category"} onSubmit={handleSubmit(onValidSubmit)} onCancel={onClose} >
        <div className="md:col-span-2">
          <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name <span className="text-red-500">*</span></label>
          <Input
            type="text"
            {...register("category")}
            placeholder="Enter a new category name"
            required
            disabled={isLoading}
            className="dark:bg-gray-800"
          />
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
        </div>

        <div className={`rounded-md border p-3 ${isEditMode ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-900/20" : "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"}`}>
          <h4 className={`mb-1 text-sm font-medium ${isEditMode ? "text-yellow-900 dark:text-yellow-200" : "text-blue-900 dark:text-blue-200"}`}>
            Notes:
          </h4>
          <ul className={`space-y-1 text-xs ${isEditMode ? "text-yellow-800 dark:text-yellow-200/80" : "text-blue-800 dark:text-blue-200/80"}`}>
            <li>• Category name will be converted to uppercase with underscores.</li>
            {isEditMode && <li>• This will update the category for ALL associated lookup types.</li>}
            {!isEditMode && <li>• A default 'DEFAULT' lookup type will be created.</li>}
          </ul>
        </div>
      </FormCard>
    </Modal>
  );
}

