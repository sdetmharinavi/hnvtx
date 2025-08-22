import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { employeeSchema } from "@/schemas/schema";
import { Tables } from "@/types/supabase-types";
import { Option } from "@/components/common/SearchableSelect";
import { EmployeeWithRelations } from "./employee-types";
import { FormDateInput, FormInput, FormSearchableSelect, FormTextarea } from "@/components/common/FormControls";

// Define the form-specific schema by omitting fields not in the form
// (dates are kept as z.coerce.date in schema and will be coerced by the resolver)
const formSchema = employeeSchema
  .omit({
    id: true,
    status: true,
    created_at: true,
    updated_at: true,
  });

// RHF field values (input to Zod) and parsed values (output from Zod)
type EmployeeFormInput = z.input<typeof formSchema>;
type EmployeeFormOutput = z.output<typeof formSchema>;

const EmployeeForm = ({
  employee,
  onSubmit,
  onCancel,
  isLoading,
  designations,
  maintenanceAreas,
}: {
  employee?: EmployeeWithRelations | null;
  onSubmit: (data: EmployeeFormOutput) => void;
  onCancel: () => void;
  isLoading: boolean;
  designations: Tables<"employee_designations">[];
  maintenanceAreas: Tables<"maintenance_areas">[];
}) => {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<EmployeeFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_name: employee?.employee_name || "",
      employee_pers_no: employee?.employee_pers_no || null,
      employee_designation_id: employee?.employee_designation_id || null,
      employee_contact: employee?.employee_contact || null,
      employee_email: employee?.employee_email || "",
      employee_dob: employee?.employee_dob ? new Date(employee.employee_dob) : null,
      employee_doj: employee?.employee_doj ? new Date(employee.employee_doj) : null,
      employee_addr: employee?.employee_addr || null,
      maintenance_terminal_id: employee?.maintenance_terminal_id || null,
      remark: employee?.remark || null,
    },
  });

  const designationOptions: Option[] = designations.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const maintenanceAreaOptions: Option[] = maintenanceAreas.map((area) => ({
    value: area.id,
    label: `${area.name}${area.code ? ` (${area.code})` : ""}`,
  }));

  const handleFormSubmit = (data: EmployeeFormInput) => {
    // zodResolver already coerces and parses values at runtime.
    // RHF types the callback with the input type, so cast to the output when forwarding.
    onSubmit(data as EmployeeFormOutput);
  };


  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold dark:text-white">
          {employee ? "Edit Employee" : "Add New Employee"}
        </h2>

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
              searchPlaceholder="Search designations..."
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
            register={register}
            error={errors.employee_addr}
            rows={3}
            placeholder="Enter address"
          />

          <FormTextarea
            name="remark"
            label="Remarks"
            register={register}
            error={errors.remark}
            rows={2}
            placeholder="Enter remarks"
          />
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4 mt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {isLoading ? "Saving..." : employee ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;