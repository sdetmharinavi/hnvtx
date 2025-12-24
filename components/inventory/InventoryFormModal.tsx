"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/ui";
import {
  FormCard,
  FormInput,
  FormSearchableSelect,
  FormDateInput,
  FormTextarea,
} from "@/components/common/form";
import {
  Inventory_itemsInsertSchema,
  inventory_itemsInsertSchema,
  V_inventory_itemsRowSchema,
} from "@/schemas/zod-schemas";
import { z } from "zod";
import {
  useLookupTypeOptions,
  useActiveNodeOptions,
  useMaintenanceAreaOptions,
} from "@/hooks/data/useDropdownOptions";

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

  const { options: categoryOptions } = useLookupTypeOptions("INVENTORY_CATEGORY");
  const { options: statusOptions } = useLookupTypeOptions("INVENTORY_STATUS");
  const { options: locationOptions } = useActiveNodeOptions();
  const { options: functionalLocationOptions } = useMaintenanceAreaOptions();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty }, // Extract isDirty
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
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
      if (editingItem) {
        reset({
          asset_no: editingItem.asset_no,
          name: editingItem.name ?? "",
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
          asset_no: "",
          name: "",
          description: "",
          quantity: 1,
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleFormSubmit = (values: FormSchemaType) => {
    onSubmit(values as Inventory_itemsInsertSchema);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose} // Use handleClose
      title={isEditMode ? "Edit Inventory Item" : "Add Inventory Item"}
      className='w-0 h-0 bg-transparent'
      closeOnOverlayClick={false}>
      <FormCard
        onSubmit={handleSubmit(handleFormSubmit)}
        onCancel={handleClose} // Use handleClose
        isLoading={isLoading}
        title={isEditMode ? "Edit Item" : "Add New Item"}
        standalone>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput
            name='asset_no'
            label='Asset No'
            register={register}
            error={errors.asset_no}
            placeholder='e.g., CHR-001'
          />
          <FormInput
            name='name'
            label='Item Name'
            register={register}
            error={errors.name}
            required
            placeholder='e.g., Office Chair'
          />
          <FormSearchableSelect
            name='category_id'
            label='Category'
            control={control}
            options={categoryOptions}
            error={errors.category_id}
          />
          <FormSearchableSelect
            name='status_id'
            label='Status'
            control={control}
            options={statusOptions}
            error={errors.status_id}
          />
          <FormSearchableSelect
            name='location_id'
            label='Location (Node)'
            control={control}
            options={locationOptions}
            error={errors.location_id}
          />
          <FormSearchableSelect
            name='functional_location_id'
            label='Functional Location (Area)'
            control={control}
            options={functionalLocationOptions}
            error={errors.functional_location_id}
          />
          <FormInput
            name='quantity'
            label='Quantity'
            type='number'
            register={register}
            error={errors.quantity}
            required
          />
          <FormDateInput
            name='purchase_date'
            label='Purchase Date'
            control={control}
            error={errors.purchase_date}
          />
          <FormInput name='vendor' label='Vendor' register={register} error={errors.vendor} />
          <FormInput
            name='cost'
            label='Cost'
            type='number'
            step='0.01'
            register={register}
            error={errors.cost}
          />
          <div className='md:col-span-2'>
            <FormTextarea
              name='description'
              label='Description'
              control={control}
              error={errors.description}
            />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};
