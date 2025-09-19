import { motion } from "framer-motion";
import { FiX, FiMail, FiPhone, FiUser, FiBriefcase, FiCalendar, FiEdit3 } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useTableRecord } from "@/hooks/database";
import { Employee_designationsRowSchema, EmployeesRowSchema } from "@/schemas/zod-schemas";

type Props = {
  employeeId: string;
  onClose: () => void;
  onEdit: () => void;
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

const EmployeeDetailsModal = ({ employeeId, onClose, onEdit }: Props) => {
  const supabase = createClient();

  const { data: employee, isLoading, isError, error } = useTableRecord(
    supabase,
    "employees",
    employeeId,
    {
      columns: "*, employee_designations(name), maintenance_areas(name)",
    }
  );

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

  if (isError || !employee) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isError ? "Error Loading Employee" : "Employee Not Found"}
          </h3>
          {isError && error && (
            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          )}
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = employee.status ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Inactive
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {employee.employee_name || "Unnamed Employee"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              {statusBadge}
              {employee.employee_pers_no && <span>• {employee.employee_pers_no}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Personal & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Email</label>
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FiMail className="text-gray-400" />
                  <span>{employee.employee_email || "Not provided"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Phone</label>
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FiPhone className="text-gray-400" />
                  <span>{employee.employee_contact || "Not provided"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiBriefcase className="text-green-600" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Designation</label>
                <div className="text-gray-900 dark:text-gray-100">{(employee as EmployeesRowSchema & { employee_designations: Employee_designationsRowSchema })?.employee_designations?.name || "Not set"}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Maintenance Area</label>
                <div className="text-gray-900 dark:text-gray-100">{(employee as  EmployeesRowSchema & { maintenance_areas: Employee_designationsRowSchema })?.maintenance_areas?.name || "Not set"}</div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiCalendar className="text-purple-600" />
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Created</label>
                <div className="text-gray-900 dark:text-gray-100">{formatDate(employee.created_at as unknown as string)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Updated</label>
                <div className="text-gray-900 dark:text-gray-100">{formatDate(employee.updated_at as unknown as string)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiEdit3 size={16} />
            Edit Employee
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeDetailsModal;
