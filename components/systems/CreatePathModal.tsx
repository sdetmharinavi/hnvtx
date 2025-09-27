"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logical_fiber_pathsInsertSchema } from "@/schemas/zod-schemas";
import { z } from "zod";
import { useTableInsert, useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "../common/ui/Modal";
import { Button } from "../common/ui/Button";
import { Input } from "../common/ui/Input";
import { SearchableSelect } from "../common/ui/select/SearchableSelect";
import { toast } from "sonner";
import { Row } from "@/hooks/database";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  system: Row<'systems'>;
  onPathCreated: () => void;
}

const createPathFormSchema = logical_fiber_pathsInsertSchema.pick({
  path_name: true,
  path_type_id: true,
  destination_system_id: true,
  remark: true,
});
type CreatePathForm = z.infer<typeof createPathFormSchema>;

export function CreatePathModal({ isOpen, onClose, system, onPathCreated }: Props) {
  const supabase = createClient();
  const { control, handleSubmit, register, formState: { errors, isSubmitting } } = useForm<CreatePathForm>({
    resolver: zodResolver(createPathFormSchema),
  });

  const { data: fetchedPathTypes } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'OFC_PATH_TYPES'} });
  const pathTypes = fetchedPathTypes?.filter(pt => pt.name !== "DEFAULT");
  const { data: systems } = useTableQuery(supabase, 'systems', { filters: { id: { operator: 'neq', value: system.id } } });

  const { mutate: createPath } = useTableInsert(supabase, 'logical_fiber_paths', {
    onSuccess: () => {
      toast.success("Logical path created successfully.");
      onPathCreated();
      onClose();
    },
    onError: (err) => toast.error(`Failed to create path: ${err.message}`),
  });

  const onSubmit = (formData: CreatePathForm) => {
    createPath({
      ...formData,
      source_system_id: system.id,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Logical Path" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Path Name*</label>
          <Input {...register("path_name")} placeholder="e.g., Primary Ring to Site B" />
          {errors.path_name && <p className="text-red-500 text-xs mt-1">{errors.path_name.message}</p>}
        </div>

        <Controller
          name="path_type_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Path Type"
              options={pathTypes?.map(pt => ({ value: pt.id, label: pt.name })) || []}
              value={field.value || ""}
              onChange={val => field.onChange(val)}
              placeholder="Select path type..."
            />
          )}
        />
        
        <Controller
          name="destination_system_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              label="Destination System"
              options={systems?.map(s => ({ value: s.id, label: s.system_name || s.id })) || []}
              value={field.value || ""}
              onChange={val => field.onChange(val)}
              placeholder="Select destination system..."
            />
          )}
        />
        
        <div>
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <textarea {...register("remark")} className="w-full rounded-md border-gray-300 dark:bg-gray-700" rows={3} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Path"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}