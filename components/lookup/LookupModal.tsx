"use client";

import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { snakeToTitleCase } from "@/utils/formatters";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Database } from "@/types/supabase-types";
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lookupTypeSchema } from "@/schemas/schema";
import z from "zod";

type Categories = Database["public"]["Tables"]["lookup_types"]["Row"];

type LookupType = Database["public"]["Tables"]["lookup_types"]["Row"];

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookupCreated?: (lookupData: LookupType) => void;
  onLookupUpdated?: (lookupData: LookupType) => void;
  editingLookup?: LookupType | null;
  category?: string;
  categories?: Categories[];
}

// Add this function to extract unique categories
const getUniqueCategories = (data?: Categories[]) => {
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
  // Database hooks
  const supabase = createClient();
  const { mutate: createLookup } = useTableInsert(supabase, "lookup_types");
  const { mutate: updateLookup } = useTableUpdate(supabase, "lookup_types");

  // console.log("categories", categories);

  const isEditMode = Boolean(editingLookup);

  // Extract unique categories
  const uniqueCategories = getUniqueCategories(categories);
  // console.log("uniqueCategories", uniqueCategories);
  
  // Create a form-specific schema
  const lookupTypeFormSchema = lookupTypeSchema.pick({
    category: true,
    code: true,
    description: true,
    name: true,
    sort_order: true,
    is_system_default: true,
    status: true,
  });
  type LookupTypeFormData = z.infer<typeof lookupTypeFormSchema>;

  // react-hook-form setup with better default values
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<LookupTypeFormData>({
    resolver: zodResolver(lookupTypeFormSchema),
    defaultValues: {
      category: "",
      code: "",
      description: "",
      name: "",
      sort_order: 0,
      is_system_default: false,
      status: true,
    },
  });

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (isOpen) {
      const resetData: LookupTypeFormData = {
        category: editingLookup?.category || category || "",
        code: editingLookup?.code || "",
        description: editingLookup?.description || "",
        name: editingLookup?.name || "",
        sort_order: editingLookup?.sort_order || 0,
        is_system_default: editingLookup?.is_system_default || false,
        status: editingLookup?.status !== false,
      };

      console.log("Resetting form with data:", resetData);
      reset(resetData);

      // Additional setValue calls to ensure the values are set properly
      setTimeout(() => {
        setValue("category", resetData.category);
        setValue("name", resetData.name);
        setValue("code", resetData.code || "");
        setValue("description", resetData.description || "");
        setValue("sort_order", resetData.sort_order);
        setValue("is_system_default", resetData.is_system_default);
        setValue("status", resetData.status);
      }, 0);
    }
  }, [isOpen, editingLookup, category, reset, setValue]);

  const onValidSubmit = useCallback(
    async (data: LookupTypeFormData) => {
      try {
        const submissionData: LookupTypeFormData = {
          ...data,
          code: data.code?.trim() || null,
          description: data.description?.trim() || null,
          name: data.name?.trim(),
          category: data.category?.trim(),
        };

        if (isEditMode && editingLookup?.id) {
          // Update existing lookup
          updateLookup(
            {
              id: editingLookup.id,
              data: submissionData,
            },
            {
              onSuccess: (updatedData) => {
                toast.success("Lookup type updated successfully");
                onLookupUpdated?.(updatedData as unknown as LookupType);
                onClose();
              },
              onError: (error) => {
                console.error("Error updating lookup type:", error);
                toast.error("Failed to update lookup type");
              },
            }
          );
        } else {
          // Create new lookup
          createLookup(submissionData, {
            onSuccess: (createdData) => {
              toast.success("Lookup type created successfully");
              onLookupCreated?.(createdData as unknown as LookupType);
              onClose();
            },
            onError: (error) => {
              console.error("Error creating lookup type:", error);
              toast.error("Failed to create lookup type");
            },
          });
        }
      } catch (error) {
        console.error("Error submitting lookup type:", error);
        toast.error("Failed to submit lookup type");
      }
    },
    [
      isEditMode,
      editingLookup,
      updateLookup,
      createLookup,
      onLookupUpdated,
      onLookupCreated,
      onClose,
    ]
  );

  const modalTitle = isEditMode ? "Edit Lookup Type" : "Add Lookup Type";
  const submitButtonText = isEditMode
    ? isSubmitting
      ? "Updating..."
      : "Update Lookup Type"
    : isSubmitting
    ? "Creating..."
    : "Create Lookup Type";

  const canSubmit = Boolean(
    watch("category")?.trim() && watch("name")?.trim() && !isSubmitting
  );

  // Watch values for debugging
  const watchedCategory = watch("category");
  const watchedName = watch("name");
  const watchedCode = watch("code");

  console.log("category prop:", category);
  console.log("editingLookup:", editingLookup);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500 dark:text-red-400">*</span>
            </label>

            {isEditMode || category ? (
              // Read-only category in edit mode or when category is provided
              <div className="space-y-1">
                <Input
                  type="text"
                  {...register("category")}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={watchedCategory || ""}
                />
                {errors.category && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {errors.category.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEditMode
                    ? "Category cannot be changed when editing"
                    : "Category is set from parent"}
                </p>
              </div>
            ) : (
              // Category selection for create mode
              <div className="space-y-2">
                <select
                  {...register("category")}
                  className={`w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.category
                      ? "border-red-300 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={isSubmitting}
                  value={watchedCategory || ""}
                  onChange={(e) => setValue("category", e.target.value)}
                >
                  <option value="">Select category...</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {snakeToTitleCase(cat)}
                    </option>
                  ))}
                </select>

                {errors.category && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {errors.category.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Name Field */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <Input
              type="text"
              {...register("name")}
              placeholder="Enter lookup name"
              disabled={isSubmitting}
              value={watchedName || ""}
              onChange={(e) => setValue("name", e.target.value)}
              className={`${
                errors.name ? "border-red-300 dark:border-red-600" : ""
              } dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Code Field */}
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Code
            </label>
            <Input
              type="text"
              id="code"
              {...register("code")}
              placeholder="Enter code (optional)"
              value={watchedCode || ""}
              disabled={isSubmitting}
              onChange={(e) => setValue("code", e.target.value)}
              className={`${
                errors.code ? "border-red-300 dark:border-red-600" : ""
              } dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
            />
            {errors.code && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* Sort Order Field */}
          <div>
            <label htmlFor="sort_order" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort Order
            </label>
            <Input
              type="number"
              id="sort_order"
              {...register("sort_order", { valueAsNumber: true })}
              placeholder="0"
              disabled={isSubmitting}
              min="0"
              className={`${
                errors.sort_order ? "border-red-300 dark:border-red-600" : ""
              } dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
            />
            {errors.sort_order && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.sort_order.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              rows={3}
              {...register("description")}
              placeholder="Enter description (optional)"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_system_default"
                {...register("is_system_default")}
                disabled={
                  isSubmitting ||
                  (isEditMode && !!editingLookup?.is_system_default)
                }
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:ring-offset-gray-800"
              />
              <label
                htmlFor="is_system_default"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                System Default
                {isEditMode && editingLookup?.is_system_default && (
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    (cannot be changed)
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="status"
                {...register("status")}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:ring-offset-gray-800"
              />
              <label
                htmlFor="status"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Active Status
              </label>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        {isEditMode ? (
          <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
            <h4 className="mb-1 text-sm font-medium text-amber-900 dark:text-amber-200">
              Edit Mode Notes:
            </h4>
            <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200/80">
              <li>• Category field cannot be changed after creation</li>
              <li>• System default status cannot be removed once set</li>
              <li>• Updated timestamp will be set automatically</li>
            </ul>
          </div>
        ) : (
          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
            <h4 className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-200">
              {category ? "Adding to Lookup" : "Creating New Lookup Type"}
            </h4>
            <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200/80">
              <li>• Timestamps will be set automatically</li>
              <li>• ID will be generated automatically</li>
              {!category && (
                <li>• Select an existing category or create a new one</li>
              )}
            </ul>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}