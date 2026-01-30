// components/expenses/ExpenseFormModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { FormInput, FormDateInput, FormSearchableSelect, FormTextarea } from '@/components/common/form/FormControls';
import { useDropdownOptions, useEmployeeOptions } from '@/hooks/data/useDropdownOptions';
import { expensesInsertSchema, ExpensesInsertSchema, V_expenses_completeRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: V_expenses_completeRowSchema | null;
  onSubmit: (data: ExpensesInsertSchema) => void;
  isLoading: boolean;
}

// Extend schema to include the new field (temporary until type gen updates)
const formSchema = expensesInsertSchema.extend({
  expense_date: z.string().min(1, "Date is required"),
  // We use z.any() temporarily because 'spent_by_employee_id' isn't in your generated types yet
  spent_by_employee_id: z.string().optional().nullable(),
});

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isLoading,
}) => {
  const isEditMode = !!record;

  // 1. Fetch Advances (to link to)
  const { options: advanceOptions, originalData: advancesRaw, isLoading: loadingAdvances } = useDropdownOptions({
    tableName: 'v_advances_complete',
    valueField: 'id',
    labelField: 'req_no',
    filters: { status: 'active' },
    orderBy: 'created_at',
    orderDir: 'desc'
  });

  // 2. Fetch Employees (for "Spent By")
  const { options: employeeOptions, isLoading: loadingEmployees } = useEmployeeOptions();

  const categoryOptions = [
    { value: 'PT-PT', label: 'PT-PT' },
    { value: 'RENTAL', label: 'Rental' },
    { value: 'FUEL', label: 'Fuel' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OTHER', label: 'Other' },
  ];

  const form = useForm<ExpensesInsertSchema & { spent_by_employee_id?: string | null }>({
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
      spent_by_employee_id: null 
    }
  });

  const { register, control, reset, watch, setValue, formState: { errors } } = form;

  // Watch advance_id to auto-fill spent_by
  const selectedAdvanceId = watch('advance_id');

  useEffect(() => {
    // Only auto-set if:
    // 1. We are NOT in edit mode (don't overwrite existing data)
    // 2. An advance is selected
    // 3. The user hasn't manually selected a spender yet (optional UX choice)
    if (!isEditMode && selectedAdvanceId && advancesRaw) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectedAdvance = (advancesRaw as any[]).find(a => a.id === selectedAdvanceId);
        if (selectedAdvance && selectedAdvance.employee_id) {
            setValue('spent_by_employee_id', selectedAdvance.employee_id);
        }
    }
  }, [selectedAdvanceId, advancesRaw, isEditMode, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (record) {
        reset({
          id: record.id || undefined,
          advance_id: record.advance_id || null,
          expense_date: record.expense_date || new Date().toISOString().split('T')[0],
          category: record.category || 'PT-PT',
          vendor: record.vendor || '',
          invoice_no: record.invoice_no || '',
          amount: record.amount || 0,
          terminal_location: record.terminal_location || 'HNV TM',
          description: record.description || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spent_by_employee_id: (record as any).spent_by_employee_id || null
        });
      } else {
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
          spent_by_employee_id: null
        });
      }
    }
  }, [isOpen, record, reset, advanceOptions]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Entry"
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSearchableSelect
                name="advance_id"
                label="Link to Advance (REQ NO) *"
                control={control}
                options={advanceOptions}
                isLoading={loadingAdvances}
                error={errors.advance_id}
                placeholder="Select Advance Request..."
            />
            
            {/* NEW FIELD */}
            <FormSearchableSelect
                name="spent_by_employee_id"
                label="Spent By (Employee)"
                control={control}
                options={employeeOptions}
                isLoading={loadingEmployees}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error={(errors as any).spent_by_employee_id}
                placeholder="Select who used the money..."
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDateInput
                name="expense_date"
                label="Date *"
                control={control}
                error={errors.expense_date}
            />
            <FormSearchableSelect
                name="category"
                label="Type *"
                control={control}
                options={categoryOptions}
                error={errors.category}
            />

            <FormInput
                name="vendor"
                label="Ride Provider / Vendor"
                register={register}
                error={errors.vendor}
                placeholder="e.g. OLA, INDRIVE"
            />
             <FormInput
                name="invoice_no"
                label="Invoice No"
                register={register}
                error={errors.invoice_no}
                placeholder="e.g. CRN..."
            />

            <FormInput
                name="amount"
                label="Amount (Rs) *"
                type="number"
                register={register}
                error={errors.amount}
                min={0}
            />
             <FormInput
                name="terminal_location"
                label="Terminal / Location"
                register={register}
                error={errors.terminal_location}
                placeholder="e.g. HNV TM"
            />
        </div>

        <FormTextarea
            name="description"
            label="Details"
            control={control}
            error={errors.description}
            rows={2}
        />
      </div>
    </BaseFormModal>
  );
};