// path: components/employee/EmployeeForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import {
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormTextarea,
} from "@/components/common/form/FormControls";
import { Modal } from "@/components/common/ui";
import { FormCard } from "@/components/common/form";
import { useEffect, useCallback } from "react";
import {
  Employee_designationsRowSchema,
  employeesInsertSchema,
  EmployeesInsertSchema,
  Maintenance_areasRowSchema,
  V_employeesRowSchema,
} from "@/schemas/zod-schemas";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: V_employeesRowSchema | null;
  onSubmit: (data: EmployeesInsertSchema) => void;
  onCancel: () => void;
  isLoading: boolean;
  designations: Employee_designationsRowSchema[];
  maintenanceAreas: Maintenance_areasRowSchema[];
}

const EmployeeForm = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
  isLoading,
  designations,
  maintenanceAreas,
}: EmployeeFormProps) => {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isDirty }, // Added isDirty
    reset,
  } = useForm<EmployeesInsertSchema>({
    resolver: zodResolver(employeesInsertSchema),
    defaultValues: {
      employee_name: "",
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
  });

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        reset({
          employee_name: employee.employee_name || "",
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
          employee_name: "",
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

  const designationOptions: Option[] = designations.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const maintenanceAreaOptions: Option[] = maintenanceAreas.map((area) => ({
    value: area.id,
    label: `${area.name}${area.code ? ` (${area.code})` : ""}`,
  }));

  const onValidFormSubmit = (data: EmployeesInsertSchema) => {
    onSubmit(data);
  };

  // Safe close
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Close anyway?")) return;
    }
    onClose();
  }, [isDirty, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={employee ? "Edit Employee" : "Add New Employee"}
      visible={false}
      className='bg-transparent h-0 w-0'
      closeOnOverlayClick={false}
      closeOnEscape={!isDirty}>
      <FormCard
        title={employee ? "Edit Employee" : "Add New Employee"}
        onSubmit={handleSubmit(onValidFormSubmit)}
        onCancel={handleClose}
        isLoading={isLoading}
        disableSubmit={isLoading}
        standalone>
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
      </FormCard>
    </Modal>
  );
};

export default EmployeeForm;
