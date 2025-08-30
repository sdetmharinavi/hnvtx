import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeFormData, employeeFormSchema } from "@/schemas";
import { Tables } from "@/types/supabase-types";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { EmployeeWithRelations } from "./employee-types";
import {
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormTextarea,
} from "@/components/common/form/FormControls";
import { Modal } from "@/components/common/ui";
import { FormCard } from "@/components/common/form";
import { useEffect } from "react";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeWithRelations | null;
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  designations: Tables<"employee_designations">[];
  maintenanceAreas: Tables<"maintenance_areas">[];
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
    formState: { errors },
    reset
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_name: employee?.employee_name || "",
      employee_pers_no: employee?.employee_pers_no || null,
      employee_designation_id: employee?.employee_designation_id || null,
      employee_contact: employee?.employee_contact || null,
      employee_email: employee?.employee_email || "",
      employee_dob: employee?.employee_dob
        ? new Date(employee.employee_dob)
        : null,
      employee_doj: employee?.employee_doj
        ? new Date(employee.employee_doj)
        : null,
      employee_addr: employee?.employee_addr || null,
      maintenance_terminal_id: employee?.maintenance_terminal_id || null,
      remark: employee?.remark || null,
    },
  });

  useEffect(() => {
    if (employee) {
        const defaultValues = {
          employee_name: employee?.employee_name || "",
          employee_pers_no: employee?.employee_pers_no || null,
          employee_designation_id: employee?.employee_designation_id || null,
          employee_contact: employee?.employee_contact || null,
          employee_email: employee?.employee_email || "",
          employee_dob: employee?.employee_dob
            ? new Date(employee.employee_dob)
            : null,
          employee_doj: employee?.employee_doj
            ? new Date(employee.employee_doj)
            : null,
          employee_addr: employee?.employee_addr || null,
          maintenance_terminal_id: employee?.maintenance_terminal_id || null,
          remark: employee?.remark || null,
      };
      reset(defaultValues);
    } else {
      reset({
        employee_name: "",
        employee_pers_no: null,
        employee_designation_id: null,
        employee_contact: null,
        employee_email: "",
        employee_dob: null,
        employee_doj: null,
        employee_addr: null,
        maintenance_terminal_id: null,
        remark: null,
      });
    }
  }, [employee]);

  const designationOptions: Option[] = designations.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const maintenanceAreaOptions: Option[] = maintenanceAreas.map((area) => ({
    value: area.id,
    label: `${area.name}${area.code ? ` (${area.code})` : ""}`,
  }));

  const handleClose = () => {
    onClose();
  };

  const onValidFormSubmit = (data: EmployeeFormData) => {
    onSubmit(data);
  };

  return (
    <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={""}
          size="full"
          visible={false}
          className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
        >
      <FormCard
        title={employee ? "Edit Employee" : "Add New Employee"}
        onSubmit={handleSubmit(onValidFormSubmit)}
        onCancel={handleClose}
        standalone
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              name="employee_name"
              label="Employee Name"
              id="employee_name"
              register={register}
              error={errors.employee_name}
              required
              placeholder="Enter employee name"
            />
            <FormInput
              name="employee_pers_no"
              label="Personnel Number"
              id="employee_pers_no"
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
              searchPlaceholder="Search designations..."
            />
            <FormInput
              name="employee_contact"
              label="Contact Number"
              id="employee_contact"
              register={register}
              error={errors.employee_contact}
              type="tel"
              placeholder="Enter contact number"
            />
            <FormInput
              name="employee_email"
              label="Email Address"
              id="employee_email"
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
              required
              placeholder="Select date of birth"
            />
            <FormDateInput
              name="employee_doj"
              label="Date of Joining"
              control={control}
              error={errors.employee_doj}
              required
              placeholder="Select date of joining"
            />
            <FormSearchableSelect
              name="maintenance_terminal_id"
              label="Maintenance Area"
              control={control}
              options={maintenanceAreaOptions}
              error={errors.maintenance_terminal_id}
              placeholder="Select maintenance area"
              searchPlaceholder="Search maintenance areas..."
            />
          </div>

          <FormTextarea
            name="employee_addr"
            label="Address"
            id="employee_addr"
            register={register}
            error={errors.employee_addr}
            rows={3}
            placeholder="Enter address"
          />

          <FormTextarea
            name="remark"
            label="Remarks"
            id="remark"
            register={register}
            error={errors.remark}
            rows={2}
            placeholder="Enter remarks"
          />
        </div>
      </FormCard>
    </Modal>
  );
};

export default EmployeeForm;