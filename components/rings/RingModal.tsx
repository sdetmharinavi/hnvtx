"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/common/ui/Button";
import { Input } from "@/components/common/ui/Input";
import { Modal } from "@/components/common/ui/Modal";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import { useTableInsert, useTableUpdate, useTableQuery } from "@/hooks/database";
import { ringSchema } from "@/schemas";
import z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export type RingRow = Database["public"]["Tables"]["rings"]["Row"];
export type RingInsert = TablesInsert<"rings">;

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRing?: RingRow | null;
  onCreated?: (ring: RingRow) => void;
  onUpdated?: (ring: RingRow) => void;
}

export function RingModal({ isOpen, onClose, editingRing, onCreated, onUpdated }: RingModalProps) {
  // Create a form-specific schema that excludes timestamp fields
  const ringFormSchema = ringSchema.pick({
    name: true,
    description: true,
    ring_type_id: true,
    maintenance_terminal_id: true,
    status: true
  });

  type RingForm = z.infer<typeof ringFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<RingForm>({
    resolver: zodResolver(ringFormSchema),
    defaultValues: {
      name: "",
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true
    },
  });

  const supabase = createClient();
  const { mutate: insertRing, isPending: creating } = useTableInsert(supabase, "rings");
  const { mutate: updateRing, isPending: updating } = useTableUpdate(supabase, "rings");

  const isEdit = useMemo(() => Boolean(editingRing), [editingRing]);

  // Fetch ring types (from lookup_types with category RING_TYPES) and maintenance areas
  const { data: ringTypes = [], isLoading: ringTypesLoading } = useTableQuery(supabase, "lookup_types", {
    filters: { category: { operator: "eq", value: "RING_TYPES" }, name: { operator: "neq", value: "DEFAULT" } },
    orderBy: [{ column: "name", ascending: true }],
  });
  const { data: maintenanceAreas = [], isLoading: areasLoading } = useTableQuery(supabase, "maintenance_areas", {
    filters: { status: { operator: "eq", value: true } },
    orderBy: [{ column: "name", ascending: true }],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingRing) {
      reset({
        name: editingRing.name ?? "",
        description: editingRing.description ?? null,
        status: editingRing.status ?? true,
        ring_type_id: editingRing.ring_type_id ?? null,
        maintenance_terminal_id: editingRing.maintenance_terminal_id ?? null,
      });
    } else {
      reset({
        name: "",
        description: null,
        status: true,
        ring_type_id: null,
        maintenance_terminal_id: null,
      });
    }
  }, [isOpen, editingRing, reset]);

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback((formData: RingForm) => {
    const submitData = {
      name: formData.name.trim(),
      description: formData.description,
      status: formData.status,
      ring_type_id: formData.ring_type_id,
      maintenance_terminal_id: formData.maintenance_terminal_id
    };

    if (isEdit && editingRing) {
      updateRing(
        { id: editingRing.id, data: submitData as Partial<RingInsert> },
        {
          onSuccess: (data: any) => {
            onUpdated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        }
      );
    } else {
      insertRing(
        submitData as RingInsert,
        {
          onSuccess: (data: any) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        }
      );
    }
  }, [isEdit, editingRing, updateRing, insertRing, onUpdated, onCreated, onClose]);

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Ring" : "Add Ring"}>
      <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <Input
              {...register("name")}
              placeholder="Enter ring name"
              disabled={submitting}
              className="dark:bg-gray-800 dark:text-gray-100"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ring Type</label>
            <Controller
              name="ring_type_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={ringTypes.map((rt) => ({ 
                    value: rt.id,
                    label: `${rt.name}${rt.code ? ` (${rt.code})` : ""}`
                  } as Option))}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value || null)}
                  placeholder="Select ring type"
                  searchPlaceholder="Search ring types..."
                  clearable={true}
                  className="w-full"
                  disabled={submitting || ringTypesLoading}
                />
              )}
            />
            {errors.ring_type_id && <p className="mt-1 text-xs text-red-600">{errors.ring_type_id.message}</p>}
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <div className="flex items-center gap-2 py-2">
              <input
                id="status"
                type="checkbox"
                {...register("status")}
                disabled={submitting}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="status" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance Terminal</label>
            <Controller
              name="maintenance_terminal_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={maintenanceAreas.map((a) => ({ 
                    value: a.id,
                    label: `${a.name}${a.code ? ` (${a.code})` : ""}`
                  } as Option))}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value || null)}
                  placeholder="Select maintenance terminal"
                  searchPlaceholder="Search maintenance terminals..."
                  clearable={true}
                  className="w-full"
                  disabled={submitting || areasLoading}
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Optional description"
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="dark:border-gray-600 dark:hover:bg-gray-700">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>{isEdit ? "Save Changes" : "Create Ring"}</Button>
        </div>
      </form>
    </Modal>
  );
}