// components/employee/EmployeeDetailsModal.tsx
import { FiX, FiMail, FiPhone, FiUser, FiBriefcase, FiCalendar, FiEdit3 } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useTableRecord } from "@/hooks/database";
import { EmployeesRowSchema } from "@/schemas/zod-schemas";

type EmployeeData = EmployeesRowSchema & {
  employee_designations?: { name: string } | null;
  maintenance_areas?: { name: string } | null;
};

type Props = {
  // Accept either employee data or employeeId
  employee?: EmployeeData;
  employeeId?: string;
  onClose: () => void;
  onEdit?: () => void;  // Make onEdit optional
  isOpen?: boolean;     // Add isOpen prop
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Not provided";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

const EmployeeDetailsModal = ({ employee, employeeId, onClose, onEdit }: Props) => {
  const supabase = createClient();

  // Only fetch if employeeId is provided and employee data is not provided
  const { data: fetchedEmployee, isLoading, isError, error } = useTableRecord(
    supabase,
    "employees",
    employeeId || "",
    employeeId ? {
      columns: "*, employee_designations(name), maintenance_areas(name)",
    } : undefined
  );

  // Use the passed employee or the fetched employee
  const currentEmployee = employee || fetchedEmployee;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 text-center">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (isError || !currentEmployee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 className="text-lg font-medium text-red-600 mb-4">Error</h3>
          <p className="text-gray-700 mb-4">
            {error?.message || 'Failed to load employee details'}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Rest of your component remains the same
  // Just make sure to use currentEmployee instead of employee
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <FiUser className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {currentEmployee.employee_name || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Add other employee details here */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <FiMail className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">
                {currentEmployee.employee_email || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <FiPhone className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">
                {currentEmployee.employee_contact || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <FiBriefcase className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Designation</p>
              <p className="font-medium">
                {typeof currentEmployee.employee_designation_id === 'object' 
                  ? currentEmployee.employee_name
                  : 'Not provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <FiCalendar className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Joining</p>
              <p className="font-medium">
                {formatDate(currentEmployee.employee_doj)}
              </p>
            </div>
          </div>

          {/* Add more fields as needed */}

          <div className="pt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <FiEdit3 size={16} />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;