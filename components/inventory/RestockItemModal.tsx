// components/inventory/RestockItemModal.tsx
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/common/ui/Modal';
import { FormCard, FormInput, FormDateInput, FormTextarea } from '@/components/common/form';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { formatCurrency } from '@/utils/formatters';
import { RestockItemFormData, restockItemSchema } from '@/hooks/inventory-actions';

interface RestockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: V_inventory_itemsRowSchema | null;
  onSubmit: (data: RestockItemFormData) => void;
  isLoading: boolean;
}

export const RestockItemModal: React.FC<RestockItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<RestockItemFormData>({
    resolver: zodResolver(restockItemSchema),
    defaultValues: {
      quantity: 1,
      restock_date: new Date().toISOString().split('T')[0],
      source: '',
      reason: 'New Stock Arrival',
      unit_cost: 0,
    },
  });

  // Watch values for live calculations
  const quantityToAdd = watch('quantity') || 0;
  const unitCost = watch('unit_cost') || 0;
  const currentStock = item?.quantity || 0;
  const calculatedTotalCost = quantityToAdd * unitCost;

  useEffect(() => {
    if (isOpen && item) {
      reset({
        item_id: item.id!,
        quantity: 1,
        restock_date: new Date().toISOString().split('T')[0],
        source: item.vendor || '',
        reason: 'New Stock Arrival',
        unit_cost: item.cost || 0,
      });
    }
  }, [isOpen, item, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Stock: ${item?.name}`} size='lg'>
      <FormCard
        title='Restock Inventory'
        subtitle={`Current Stock: ${currentStock}`}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        submitText='Confirm Addition'
        standalone
      >
        <div className='space-y-6'>
          {/* Live Calculation Box */}
          <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 dark:text-gray-400 font-medium'>
                Value of New Stock
              </p>
              <p className='text-xl font-bold text-green-600 dark:text-green-400'>
                {formatCurrency(calculatedTotalCost)}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-500 dark:text-gray-400 font-medium'>
                New Total Stock
              </p>
              <p className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                {currentStock + quantityToAdd}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput
              name='quantity'
              label='Quantity to Add'
              type='number'
              register={register}
              error={errors.quantity}
              required
              min={1}
            />
            <FormInput
              name='unit_cost'
              label='Unit Cost (Rs)'
              type='number'
              step='0.01'
              register={register}
              error={errors.unit_cost}
              required
              min={0}
            />
            <FormDateInput
              name='restock_date'
              label='Date of Restock'
              control={control}
              error={errors.restock_date}
              required
            />
            <FormInput
              name='source'
              label='Source / Vendor'
              register={register}
              error={errors.source}
              placeholder='e.g. Supplier Name'
            />
          </div>

          <FormTextarea
            name='reason'
            label='Remarks / PO Number'
            control={control}
            error={errors.reason}
            required
            placeholder='e.g. PO-2026-001'
            rows={3}
          />
        </div>
      </FormCard>
    </Modal>
  );
};
