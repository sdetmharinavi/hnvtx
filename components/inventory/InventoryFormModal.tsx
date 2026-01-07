// components/inventory/InventoryFormModal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormInput,
  FormSearchableSelect,
  FormDateInput,
  FormTextarea,
} from '@/components/common/form';
import {
  Inventory_itemsInsertSchema,
  inventory_itemsInsertSchema,
  V_inventory_itemsRowSchema,
} from '@/schemas/zod-schemas';
import { z } from 'zod';
import {
  useLookupTypeOptions,
  useActiveNodeOptions,
  useMaintenanceAreaOptions,
} from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { localDb } from '@/hooks/data/localDb'; // ADDED

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: V_inventory_itemsRowSchema | null;
  onSubmit: (data: Inventory_itemsInsertSchema) => void;
  isLoading: boolean;
}

const formSchema = inventory_itemsInsertSchema.extend({
  purchase_date: z.string().nullable().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export const InventoryFormModal: React.FC<InventoryFormModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  onSubmit,
  isLoading,
}) => {
  const isEditMode = !!editingItem;

  const { options: categoryOptions } = useLookupTypeOptions('INVENTORY_CATEGORY');
  const { options: statusOptions } = useLookupTypeOptions('INVENTORY_STATUS');
  const { options: locationOptions } = useActiveNodeOptions();
  const { options: functionalLocationOptions } = useMaintenanceAreaOptions();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const {
    register,
    control,
    reset,
    setError, // ADDED
    formState: { errors },
  } = form;

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
          asset_no: '',
          name: '',
          description: '',
          quantity: 1,
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  // NEW: Pre-submission validation against localDb
  const handleFormSubmit = async (data: FormSchemaType) => {
    // 1. Check for Unique Asset Number
    if (data.asset_no && data.asset_no.trim() !== '') {
      try {
        const existing = await localDb.inventory_items
          .where('asset_no')
          .equals(data.asset_no.trim())
          .first();

        // If a record exists with this asset_no AND it's not the record we are currently editing
        // Note: We check against editingItem.id (View) vs existing.id (Table), which matches.
        if (existing && (!editingItem || existing.id !== editingItem.id)) {
          setError('asset_no', {
            type: 'manual',
            message: 'This Asset Number is already in use.',
          });
          return; // Stop submission
        }
      } catch (err) {
        console.error('Local validation check failed', err);
        // Continue to server validation if local check fails (fail-open for UX)
      }
    }

    // 2. Proceed with submission
    onSubmit(data as Inventory_itemsInsertSchema);
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Item"
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      // Use the wrapped handler
      onSubmit={handleFormSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="asset_no"
          label="Asset No"
          register={register}
          error={errors.asset_no}
          placeholder="e.g., CHR-001"
        />
        <FormInput
          name="name"
          label="Item Name"
          register={register}
          error={errors.name}
          required
          placeholder="e.g., Office Chair"
        />
        <FormSearchableSelect
          name="category_id"
          label="Category"
          control={control}
          options={categoryOptions}
          error={errors.category_id}
        />
        <FormSearchableSelect
          name="status_id"
          label="Status"
          control={control}
          options={statusOptions}
          error={errors.status_id}
        />
        <FormSearchableSelect
          name="location_id"
          label="Location (Node)"
          control={control}
          options={locationOptions}
          error={errors.location_id}
        />
        <FormSearchableSelect
          name="functional_location_id"
          label="Functional Location (Area)"
          control={control}
          options={functionalLocationOptions}
          error={errors.functional_location_id}
        />
        <FormInput
          name="quantity"
          label="Quantity"
          type="number"
          register={register}
          error={errors.quantity}
          required
        />
        <FormDateInput
          name="purchase_date"
          label="Purchase Date"
          control={control}
          error={errors.purchase_date}
        />
        <FormInput name="vendor" label="Vendor" register={register} error={errors.vendor} />
        <FormInput
          name="cost"
          label="Cost"
          type="number"
          step="0.01"
          register={register}
          error={errors.cost}
        />
        <div className="md:col-span-2">
          <FormTextarea
            name="description"
            label="Description"
            control={control}
            error={errors.description}
          />
        </div>
      </div>
    </BaseFormModal>
  );
};
