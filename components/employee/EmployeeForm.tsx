// components/employee/EmployeeForm.tsx
import {
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form/FormControls';
import {
  employeesInsertSchema,
  EmployeesInsertSchema,
  V_employeesRowSchema,
} from '@/schemas/zod-schemas';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { localDb } from '@/hooks/data/localDb';
import { useFormModal } from '@/hooks/useFormModal';
import { Option } from '@/components/common/ui/select/SearchableSelect';

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
  const { form, isEditMode } = useFormModal<EmployeesInsertSchema, V_employeesRowSchema>({
    isOpen,
    schema: employeesInsertSchema,
    record: employee,
    defaultValues: {
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
    },
    mapRecord: (rec) => ({
      employee_name: rec.employee_name || '',
      employee_pers_no: rec.employee_pers_no,
      employee_designation_id: rec.employee_designation_id,
      employee_contact: rec.employee_contact,
      employee_email: rec.employee_email,
      employee_dob: rec.employee_dob,
      employee_doj: rec.employee_doj,
      employee_addr: rec.employee_addr,
      maintenance_terminal_id: rec.maintenance_terminal_id,
      remark: rec.remark,
      status: rec.status ?? true,
    }),
  });

  const {
    register,
    control,
    setError,
    formState: { errors },
  } = form;

  const handleFormSubmit = async (data: EmployeesInsertSchema) => {
    // 1. Check for Unique Personnel Number
    if (data.employee_pers_no && data.employee_pers_no.trim() !== '') {
      try {
        const existing = await localDb.employees
          .where('employee_pers_no')
          .equals(data.employee_pers_no.trim())
          .first();

        if (existing && (!employee || existing.id !== employee.id)) {
          setError('employee_pers_no', {
            type: 'manual',
            message: 'Personnel Number is already assigned to another employee.',
          });
          return;
        }
      } catch (err) {
        console.error('Validation check failed', err);
      }
    }
    onSubmit(data);
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Employee'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={handleFormSubmit}
    >
      <div className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormInput
            name='employee_name'
            label='Employee Name'
            register={register}
            error={errors.employee_name}
            required
            placeholder='Enter employee name'
          />
          <FormInput
            name='employee_pers_no'
            label='Personnel Number'
            register={register}
            error={errors.employee_pers_no}
            placeholder='Enter personnel number'
          />
          <FormSearchableSelect
            name='employee_designation_id'
            label='Designation'
            control={control}
            options={designationOptions}
            error={errors.employee_designation_id}
            placeholder='Select designation'
          />
          <FormInput
            name='employee_contact'
            label='Contact Number'
            register={register}
            error={errors.employee_contact}
            type='tel'
            placeholder='Enter contact number'
          />
          <FormInput
            name='employee_email'
            label='Email Address'
            register={register}
            error={errors.employee_email}
            type='email'
            placeholder='Enter email address'
          />
          <FormDateInput
            name='employee_dob'
            label='Date of Birth'
            control={control}
            error={errors.employee_dob}
          />
          <FormDateInput
            name='employee_doj'
            label='Date of Joining'
            control={control}
            error={errors.employee_doj}
          />
          <FormSearchableSelect
            name='maintenance_terminal_id'
            label='Maintenance Area'
            control={control}
            options={maintenanceAreaOptions}
            error={errors.maintenance_terminal_id}
            placeholder='Select maintenance area'
          />
          <FormSwitch name='status' label='' control={control} error={errors.status} />
        </div>
        <FormTextarea
          name='employee_addr'
          label='Address'
          control={control}
          error={errors.employee_addr}
          rows={3}
          placeholder='Enter address'
        />
        <FormTextarea
          name='remark'
          label='Remarks'
          control={control}
          error={errors.remark}
          rows={2}
          placeholder='Enter remarks'
        />
      </div>
    </BaseFormModal>
  );
};

export default EmployeeForm;
