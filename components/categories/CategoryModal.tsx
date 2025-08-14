"use client";

import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { lookupTypeSchema } from "@/schemas/schema";
import { Database } from "@/types/supabase-types";
import { snakeToTitleCase } from "@/utils/formatters";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

type CategoryFormData = Database["public"]["Tables"]["lookup_types"]["Insert"];
type Categories = Database["public"]["Tables"]["lookup_types"]["Row"];
type GroupedLookupsByCategory = Record<string, Categories[]>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryData: CategoryFormData) => void;
  editingCategory?: string;
  categories?: Categories[];
  lookupsByCategory?: GroupedLookupsByCategory;
}

export function CategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
  editingCategory,
  categories,
  lookupsByCategory,
}: CategoryModalProps) {
  const categoryFormSchema = lookupTypeSchema.pick({
    category: true,
    code: true,
    description: true,
    name: true,
    sort_order: true,
    is_system_default: true,
    status: true,
  });
  type CategoryForm = z.infer<typeof categoryFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      category: "",
      code: "default",
      description: "",
      name: "DEFAULT",
      sort_order: 0,
      is_system_default: true,
      status: true,
    },
  });

  const supabase = createClient();
  const submissionInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { mutate: createCategory } = useTableInsert(supabase, "lookup_types");
  const { mutate: updateCategory } = useTableUpdate(supabase, "lookup_types");

// Only reset when editingCategory changes or when opening for creation
useEffect(() => {
  if (isOpen) {
    if (editingCategory) {
      const categoryLookups = lookupsByCategory?.[editingCategory] || [];
      if (categoryLookups.length > 0) {
        const template = categoryLookups[0];
        reset({
          category: template.category,
          code: template.code || "default",
          description: template.description || "",
          name: template.name || "DEFAULT",
          sort_order: template.sort_order || 0,
          is_system_default: template.is_system_default ?? true,
          status: template.status ?? true,
        });
      }
    } else {
      // New category: reset to defaults
      reset({
        category: "",
        code: "default",
        description: "",
        name: "DEFAULT",
        sort_order: 0,
        is_system_default: true,
        status: true,
      });
    }
  }
  // Do not reset on close, only on open
}, [isOpen, editingCategory, lookupsByCategory, reset]);

  const handleUpdateError = useCallback((error: unknown) => {
    const postgrestError = error as PostgrestError;
    if (
      postgrestError?.message?.includes("already exists") ||
      postgrestError?.code === "23505" ||
      postgrestError?.message?.includes("violates unique constraint")
    ) {
      toast.error("Category already exists");
    } else {
      toast.error(`Failed to update category: ${postgrestError?.message || "Unknown error"}`);
    }
  }, []);

  const handleCreateError = useCallback((error: unknown) => {
    const postgrestError = error as PostgrestError;
    if (
      postgrestError?.message?.includes("already exists") ||
      postgrestError?.code === "23505" ||
      postgrestError?.message?.includes("violates unique constraint")
    ) {
      toast.error("Category already exists");
    } else {
      toast.error(`Failed to create category: ${postgrestError?.message || "Unknown error"}`);
    }
  }, []);

  const onValidSubmit = useCallback(
    async (data: CategoryForm) => {
      const id = categories?.find((cat) => cat.category === editingCategory)?.id;
      if (submissionInProgress.current) return;

      if (!data.category.trim()) {
        toast.error("Category is required");
        return;
      }

      submissionInProgress.current = true;
      abortControllerRef.current = new AbortController();

      try {
        const formattedCategory = data.category
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_")
          .replace(/[^A-Z0-9_]/g, "");

        if (!formattedCategory) {
          toast.error("Please enter a valid category name");
          return;
        }

        const commonData = {
          ...data,
          category: formattedCategory,
          description: `Default entry for ${snakeToTitleCase(formattedCategory)} category`,
        };

        if (editingCategory) {
          updateCategory(
            { id: id!, data: commonData },
            {
              onSuccess: () => {
                if (abortControllerRef.current?.signal.aborted) return;
                toast.success(`Category renamed to "${formattedCategory}"`);
                onCategoryCreated?.(commonData);
                onClose();
              },
              onError: handleUpdateError,
              onSettled: () => {
                submissionInProgress.current = false;
              },
            }
          );
        } else {
          if (categories?.some((cat) => cat.category === formattedCategory)) {
            toast.error("Category already exists");
            submissionInProgress.current = false;
            return;
          }
          createCategory(commonData, {
            onSuccess: () => {
              if (abortControllerRef.current?.signal.aborted) return;
              onCategoryCreated?.(commonData);
              onClose();
            },
            onError: handleCreateError,
            onSettled: () => {
              submissionInProgress.current = false;
            },
          });
        }
      } catch (error) {
        console.error("Error saving category:", error);
        toast.error(`Failed to ${editingCategory ? "update" : "create"} category`);
        submissionInProgress.current = false;
      }
    },
    [categories, editingCategory, createCategory, updateCategory, onCategoryCreated, onClose, handleUpdateError, handleCreateError]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting && !submissionInProgress.current) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  const categoryValue = watch("category") || "";
  const formattedPreview = categoryValue
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

  const isEditing = !!editingCategory;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Category" : "Create New Category"}>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category {isEditing ? "Name" : ""} <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              {...register("category")}
              placeholder="Enter category (e.g., Node Type, System Type)"
              required
              disabled={isSubmitting || submissionInProgress.current}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            />
            {formattedPreview && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Will be saved as:{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700 dark:text-gray-200">
                  {formattedPreview}
                </code>
              </p>
            )}
            {errors.category && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div
          className={`rounded-md border p-3 ${
            isEditing
              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-900/20"
              : "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"
          }`}
        >
          <h4
            className={`mb-1 text-sm font-medium ${
              isEditing ? "text-yellow-900 dark:text-yellow-200" : "text-blue-900 dark:text-blue-200"
            }`}
          >
            {isEditing ? "Edit Category Notes:" : "Category Creation Notes:"}
          </h4>
          <ul
            className={`space-y-1 text-xs ${
              isEditing ? "text-yellow-800 dark:text-yellow-200/80" : "text-blue-800 dark:text-blue-200/80"
            }`}
          >
            {isEditing ? (
              <>
                <li>• This will update the category name for ALL lookup types in this category</li>
                <li>• Category name will be converted to uppercase with underscores</li>
                <li>• Special characters will be removed except letters, numbers, and underscores</li>
              </>
            ) : (
              <>
                <li>• Category field will be converted to uppercase with underscores</li>
                <li>• Special characters will be removed except letters, numbers, and underscores</li>
                <li>• Created and updated timestamps will be set automatically</li>
                <li>• ID will be generated automatically</li>
              </>
            )}
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || submissionInProgress.current}
            className="dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || submissionInProgress.current || !categoryValue.trim()}
          >
            {isSubmitting || submissionInProgress.current
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Category"
              : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
