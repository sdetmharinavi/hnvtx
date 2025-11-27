// path: app/dashboard/inventory/InventoryFormModal.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormSearchableSelect, FormDateInput, FormTextarea } from "@/components/common/form";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Inventory_itemsInsertSchema, inventory_itemsInsertSchema, V_inventory_itemsRowSchema } from "@/schemas/zod-schemas";
import { z } from "zod";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: V_inventory_itemsRowSchema | null;
  onSubmit: (data: Inventory_itemsInsertSchema) => void;
  isLoading: boolean;
}

// THE FIX: Locally override the purchase_date validation to allow date strings (YYYY-MM-DD)
// instead of strictly requiring ISO DateTime format.
const formSchema = inventory_itemsInsertSchema.extend({
  purchase_date: z.string().nullable().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export const InventoryFormModal: React.FC<InventoryFormModalProps> = ({ isOpen, onClose, editingItem, onSubmit, isLoading }) => {
  const isEditMode = !!editingItem;
  const supabase = createClient();

  const { data: categoriesResult } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'INVENTORY_CATEGORY' } });
  const { data: statusesResult } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'INVENTORY_STATUS' } });
  const { data: locationsResult } = useTableQuery(supabase, 'v_nodes_complete', { filters: { status: true } });
  const { data: functionalLocationsResult } = useTableQuery(supabase, 'maintenance_areas', { filters: { status: true } });
  
  const categoryOptions = useMemo(() => categoriesResult?.data?.map(c => ({ value: c.id, label: c.name })) || [], [categoriesResult]);
  const statusOptions = useMemo(() => statusesResult?.data?.map(s => ({ value: s.id, label: s.name })) || [], [statusesResult]);
  const locationOptions = useMemo(() => locationsResult?.data?.map(l => ({ value: l.id!, label: l.name! })) || [], [locationsResult]);
  const functionalLocationOptions = useMemo(() => functionalLocationsResult?.data?.map(l => ({ value: l.id, label: l.name })) || [], [functionalLocationsResult]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema), // Use the relaxed schema
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          asset_no: editingItem.asset_no,
          name: editingItem.name ?? '',
          description: editingItem.description,
          category_id: editingItem.category_id,
          status_id: editingItem.status_id,
          location_id: editingItem.location_id,
          functional_location_id: editingItem.functional_location_id,
          quantity: editingItem.quantity ?? 1,
          purchase_date: editingItem.purchase_date,
          vendor: editingItem.vendor,
          cost: editingItem.cost,
        });
      } else {
        reset({
          asset_no: '', name: '', description: '', quantity: 1
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleFormSubmit = (values: FormSchemaType) => {
    // The date string (YYYY-MM-DD) is perfectly valid for a DATE column in Postgres.
    // We don't need to convert it to a full ISO datetime string.
    onSubmit(values as Inventory_itemsInsertSchema);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Inventory Item' : 'Add Inventory Item'} size="full">
      <FormCard
        onSubmit={handleSubmit(handleFormSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={isEditMode ? 'Edit Item' : 'Add New Item'}
        standalone={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="asset_no" label="Asset No" register={register} error={errors.asset_no} placeholder="e.g., CHR-001"/>
          <FormInput name="name" label="Item Name" register={register} error={errors.name} required placeholder="e.g., Office Chair"/>
          <FormSearchableSelect name="category_id" label="Category" control={control} options={categoryOptions} error={errors.category_id} />
          <FormSearchableSelect name="status_id" label="Status" control={control} options={statusOptions} error={errors.status_id} />
          <FormSearchableSelect name="location_id" label="Location (Node)" control={control} options={locationOptions} error={errors.location_id} />
          <FormSearchableSelect name="functional_location_id" label="Functional Location (Area)" control={control} options={functionalLocationOptions} error={errors.functional_location_id} />
          <FormInput name="quantity" label="Quantity" type="number" register={register} error={errors.quantity} required />
          <FormDateInput name="purchase_date" label="Purchase Date" control={control} error={errors.purchase_date} />
          <FormInput name="vendor" label="Vendor" register={register} error={errors.vendor} />
          <FormInput name="cost" label="Cost" type="number" step="0.01" register={register} error={errors.cost} />
          <div className="md:col-span-2">
            <FormTextarea name="description" label="Description" control={control} error={errors.description} />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};