// components/expenses/AdvanceFormModal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { FormInput, FormDateInput, FormSelect, FormSearchableSelect, FormTextarea } from '@/components/common/form/FormControls';
import { useEmployeeOptions } from '@/hooks/data/useDropdownOptions';
import { advancesInsertSchema, AdvancesInsertSchema, V_advances_completeRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

interface AdvanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: V_advances_completeRowSchema | null;
  onSubmit: (data: AdvancesInsertSchema) => void;
  isLoading: boolean;
}

// FIX: Override the strict datetime validation for the form input
// We allow a simple string for the date input, which returns "YYYY-MM-DD"
const formSchema = advancesInsertSchema.extend({
  advance_date: z.string().min(1, "Date is required"),
});

export const AdvanceFormModal: React.FC<AdvanceFormModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isLoading,
}) => {
  const isEditMode = !!record;
  const { options: employeeOptions, isLoading: loadingEmployees } = useEmployeeOptions();

  const form = useForm<AdvancesInsertSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      req_no: '',
      amount: 0,
      advance_date: new Date().toISOString().split('T')[0],
      status: 'active',
      employee_id: null,
      description: ''
    }
  });

  const { register, control, reset, formState: { errors } } = form;

  useEffect(() => {
    if (isOpen) {
      if (record) {
        // Safe null handling for edit mode
        reset({
          id: record.id || undefined,
          req_no: record.req_no || '',
          amount: record.total_amount || 0,
          // Extract just the date part if it's an ISO string
          advance_date: record.advance_date ? record.advance_date.split('T')[0] : new Date().toISOString().split('T')[0],
          status: (record.status as 'active' | 'settled' | 'pending') || 'active',
          employee_id: record.employee_id || null,
          description: record.description || ''
        });
      } else {
        // Reset defaults for create mode
        reset({
            req_no: '',
            amount: 0,
            advance_date: new Date().toISOString().split('T')[0],
            status: 'active',
            employee_id: null,
            description: ''
        });
      }
    }
  }, [isOpen, record, reset]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Advance" : "Add Temporary Advance"}
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="req_no"
            label="Request / Reference No"
            register={register}
            error={errors.req_no}
            required
            placeholder="e.g. T00001277390"
            disabled={isEditMode} // Usually ID shouldn't change
          />
          
          <FormInput
            name="amount"
            label="Total Amount (Rs)"
            type="number"
            register={register}
            error={errors.amount}
            required
            min={0}
          />
          
          <FormDateInput
            name="advance_date"
            label="Date Issued"
            control={control}
            error={errors.advance_date}
            required
          />

          <FormSelect
            name="status"
            label="Status"
            control={control}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending Approval' },
              { value: 'settled', label: 'Settled / Closed' },
            ]}
          />
        </div>

        <FormSearchableSelect
          name="employee_id"
          label="Issued To (Employee)"
          control={control}
          options={employeeOptions}
          isLoading={loadingEmployees}
          error={errors.employee_id}
          placeholder="Select Employee..."
        />

        <FormTextarea
          name="description"
          label="Purpose / Notes"
          control={control}
          error={errors.description}
          rows={3}
        />
      </div>
    </BaseFormModal>
  );
};