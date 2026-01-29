// components/expenses/ExpenseFormModal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import {
  FormInput,
  FormDateInput,
  FormSearchableSelect,
  FormTextarea,
} from '@/components/common/form/FormControls';
import { useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import {
  expensesInsertSchema,
  ExpensesInsertSchema,
  V_expenses_completeRowSchema,
} from '@/schemas/zod-schemas';
import { z } from 'zod';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: V_expenses_completeRowSchema | null;
  onSubmit: (data: ExpensesInsertSchema) => void;
  isLoading: boolean;
}

// THE FIX: Override the strict datetime validation to accept "YYYY-MM-DD" strings from the date input
const formSchema = expensesInsertSchema.extend({
  expense_date: z.string().min(1, 'Date is required'),
});

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isLoading,
}) => {
  const isEditMode = !!record;

  // Fetch active advances to link this expense to
  // We use 'v_advances_complete' view to get req_no
  const { options: advanceOptions, isLoading: loadingAdvances } = useDropdownOptions({
    tableName: 'v_advances_complete',
    valueField: 'id',
    labelField: 'req_no',
    filters: { status: 'active' }, // Only show active advances
    orderBy: 'created_at',
    orderDir: 'desc',
  });

  const categoryOptions = [
    { value: 'PT-PT', label: 'PT-PT' },
    { value: 'RENTAL', label: 'Rental' },
    { value: 'FUEL', label: 'Fuel' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OTHER', label: 'Other' },
  ];

  const form = useForm<ExpensesInsertSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      advance_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      category: 'PT-PT',
      vendor: '',
      invoice_no: '',
      amount: 0,
      terminal_location: 'HNV TM',
      description: '',
    },
  });

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (isOpen) {
      if (record) {
        reset({
          id: record.id || undefined, // Handle null id
          advance_id: record.advance_id || null, // Handle null advance_id
          expense_date: record.expense_date || new Date().toISOString().split('T')[0],
          category: record.category || 'PT-PT',
          vendor: record.vendor || '',
          invoice_no: record.invoice_no || '',
          amount: record.amount || 0,
          terminal_location: record.terminal_location || 'HNV TM',
          description: record.description || '',
        });
      } else {
        // If there is only one active advance, auto-select it
        const defaultAdvance = advanceOptions.length === 1 ? advanceOptions[0].value : '';

        reset({
          advance_id: defaultAdvance,
          expense_date: new Date().toISOString().split('T')[0],
          category: 'PT-PT',
          vendor: '',
          invoice_no: '',
          amount: 0,
          terminal_location: 'HNV TM',
          description: '',
        });
      }
    }
  }, [isOpen, record, reset, advanceOptions]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Expense Entry'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
    >
      <div className='space-y-4'>
        <FormSearchableSelect
          name='advance_id'
          label='Link to Advance (REQ NO)'
          control={control}
          options={advanceOptions}
          isLoading={loadingAdvances}
          error={errors.advance_id}
          placeholder='Select Advance Request...'
          required
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormDateInput
            name='expense_date'
            label='Date'
            control={control}
            error={errors.expense_date}
            required
          />
          <FormSearchableSelect
            name='category'
            label='Type'
            control={control}
            options={categoryOptions}
            error={errors.category}
            required
          />

          <FormInput
            name='vendor'
            label='Ride Provider / Vendor'
            register={register}
            error={errors.vendor}
            placeholder='e.g. OLA, INDRIVE'
          />
          <FormInput
            name='invoice_no'
            label='Invoice No'
            register={register}
            error={errors.invoice_no}
            placeholder='e.g. CRN...'
          />

          <FormInput
            name='amount'
            label='Amount (Rs)'
            type='number'
            register={register}
            error={errors.amount}
            required
            min={0}
          />
          <FormInput
            name='terminal_location'
            label='Terminal / Location'
            register={register}
            error={errors.terminal_location}
            placeholder='e.g. HNV TM'
          />
        </div>

        <FormTextarea
          name='description'
          label='Details'
          control={control}
          error={errors.description}
          rows={2}
        />
      </div>
    </BaseFormModal>
  );
};
