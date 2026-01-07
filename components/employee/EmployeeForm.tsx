// components/employee/EmployeeForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import {
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormTextarea,
} from '@/components/common/form/FormControls';
import {
  employeesInsertSchema,
  EmployeesInsertSchema,
  V_employeesRowSchema,
} from '@/schemas/zod-schemas';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { localDb } from '@/hooks/data/localDb'; // ADDED

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: V_employeesRowSchema | null;
  onSubmit: (data: EmployeesInsertSchema) => void;
  isLoading: boolean;
  designationOptions: Option[];
  maintenanceAreaOptions: Option[];
}

const EmployeeForm = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
  isLoading,
  designationOptions,
  maintenanceAreaOptions,
}: EmployeeFormProps) => {
  const form = useForm<EmployeesInsertSchema>({
    resolver: zodResolver(employeesInsertSchema),
    defaultValues: {
      employee_name: '',
      status: true,
    },
  });

  const {
    reset,
    register,
    control,
    setError, // ADDED
    formState: { errors },
  } = form;

  // Reset form when modal opens or record changes
  useEffect(() => {
    if (isOpen) {
      if (employee) {
        reset({
          employee_name: employee.employee_name || '',
          employee_pers_no: employee.employee_pers_no,
          employee_designation_id: employee.employee_designation_id,
          employee_contact: employee.employee_contact,
          employee_email: employee.employee_email,
          employee_dob: employee.employee_dob,
          employee_doj: employee.employee_doj,
          employee_addr: employee.employee_addr,
          maintenance_terminal_id: employee.maintenance_terminal_id,
          remark: employee.remark,
          status: employee.status ?? true,
        });
      } else {
        reset({
          employee_name: '',
          employee_pers_no: null,
          employee_designation_id: null,
          employee_contact: null,
          employee_email: null,
          employee_dob: null,
          employee_doj: null,
          employee_addr: null,
          maintenance_terminal_id: null,
          remark: null,
          status: true,
        });
      }
    }
  }, [employee, reset, isOpen]);

  // NEW: Pre-submission validation
  const handleFormSubmit = async (data: EmployeesInsertSchema) => {
    // 1. Check for Unique Personnel Number
    if (data.employee_pers_no && data.employee_pers_no.trim() !== '') {
      try {
        const existing = await localDb.employees
          .where('employee_pers_no')
          .equals(data.employee_pers_no.trim())
          .first();

        // If a record exists AND it's not the one we are editing
        if (existing && (!employee || existing.id !== employee.id)) {
          setError('employee_pers_no', {
            type: 'manual',
            message: 'Personnel Number is already assigned to another employee.',
          });
          return; // Stop submission
        }
      } catch (err) {
        console.error('Validation check failed', err);
      }
    }

    // 2. Proceed with submission
    onSubmit(data);
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee"
      isEditMode={!!employee}
      isLoading={isLoading}
      form={form}
      onSubmit={handleFormSubmit}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            name="employee_name"
            label="Employee Name"
            register={register}
            error={errors.employee_name}
            required
            placeholder="Enter employee name"
          />
          <FormInput
            name="employee_pers_no"
            label="Personnel Number"
            register={register}
            error={errors.employee_pers_no}
            placeholder="Enter personnel number"
          />
          <FormSearchableSelect
            name="employee_designation_id"
            label="Designation"
            control={control}
            options={designationOptions}
            error={errors.employee_designation_id}
            placeholder="Select designation"
          />
          <FormInput
            name="employee_contact"
            label="Contact Number"
            register={register}
            error={errors.employee_contact}
            type="tel"
            placeholder="Enter contact number"
          />
          <FormInput
            name="employee_email"
            label="Email Address"
            register={register}
            error={errors.employee_email}
            type="email"
            placeholder="Enter email address"
          />
          <FormDateInput
            name="employee_dob"
            label="Date of Birth"
            control={control}
            error={errors.employee_dob}
          />
          <FormDateInput
            name="employee_doj"
            label="Date of Joining"
            control={control}
            error={errors.employee_doj}
          />
          <FormSearchableSelect
            name="maintenance_terminal_id"
            label="Maintenance Area"
            control={control}
            options={maintenanceAreaOptions}
            error={errors.maintenance_terminal_id}
            placeholder="Select maintenance area"
          />
        </div>
        <FormTextarea
          name="employee_addr"
          label="Address"
          control={control}
          error={errors.employee_addr}
          rows={3}
          placeholder="Enter address"
        />
        <FormTextarea
          name="remark"
          label="Remarks"
          control={control}
          error={errors.remark}
          rows={2}
          placeholder="Enter remarks"
        />
      </div>
    </BaseFormModal>
  );
};

export default EmployeeForm;
