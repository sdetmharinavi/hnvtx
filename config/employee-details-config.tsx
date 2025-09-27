// ==== EMPLOYEE DETAILS MODAL CONFIGURATION ====

import { 
  DetailsModal, 
  defaultFormatters, 
  type HeaderConfig, 
  type SectionConfig 
} from '@/components/common/ui/Modal/DetailsModal';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiBriefcase, 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiInfo 
} from "react-icons/fi";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { V_employees_with_countRowSchema, EmployeesRowSchema } from '@/schemas/zod-schemas';

type EmployeeDetails = V_employees_with_countRowSchema | (EmployeesRowSchema & { employee_designation_name?: string | null });

// Helper function to get the first letter of the name for avatar
const getInitials = (name?: string | null) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// Create header config function
const createHeaderConfig = (emp: EmployeeDetails): HeaderConfig<EmployeeDetails> => ({
  title: (data: EmployeeDetails) => data.employee_name || emp.employee_name || "Unnamed Employee",
  subtitle: (data: EmployeeDetails) => data.employee_pers_no || emp.employee_pers_no || "No Personnel No.",
  avatar: {
    urlKey: '', // employees don't have avatars
    fallbackText: (data: EmployeeDetails) => getInitials(data.employee_name || emp.employee_name)
  },
  badges: [
    {
      key: 'designation',
      component: (value: unknown, data: EmployeeDetails) => 
        data.employee_designation_name ? (
          <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
            {data.employee_designation_name}
          </span>
        ) : null
    },
    {
      key: 'status',
      component: (value: unknown, data: EmployeeDetails) => 
        <StatusBadge status={data.status ? "ACTIVE" : "INACTIVE"} />
    }
  ]
});

// Employee details modal configuration
export const employeeDetailsConfig = {
  header: createHeaderConfig({} as EmployeeDetails), // Will be overridden in the component
  
  sections: [
    {
      title: "Personal Information",
      icon: <FiUser size={20} />,
      fields: [
        { 
          key: 'employee_email', 
          label: 'Email', 
          icon: <FiMail size={18} />, 
          formatter: (email: string | null) => email || 'Not provided'
        },
        { 
          key: 'employee_contact', 
          label: 'Contact', 
          icon: <FiPhone size={18} />, 
          formatter: (contact: string | null) => contact || 'Not provided'
        },
        { 
          key: 'employee_dob', 
          label: 'Date of Birth', 
          icon: <FiCalendar size={18} />, 
          formatter: defaultFormatters.date 
        },
        { 
          key: 'employee_doj', 
          label: 'Date of Joining', 
          icon: <FiCalendar size={18} />, 
          formatter: defaultFormatters.date 
        },
        { 
          key: 'employee_addr', 
          label: 'Address', 
          icon: <FiMapPin size={18} />, 
          formatter: (addr: string | null) => addr || 'Not provided'
        }
      ]
    },
    {
      title: "Employment Details",
      icon: <FiBriefcase size={20} />,
      fields: [
        { 
          key: 'employee_designation_name', 
          label: 'Designation', 
          icon: <FiBriefcase size={18} />,
          formatter: (designation: string | null) => designation || 'Not assigned'
        },
        { 
          key: 'status', 
          label: 'Status', 
          icon: <FiInfo size={18} />,
          formatter: (status: boolean | null) => status ? 'Active' : 'Inactive'
        }
      ]
    },
    {
      title: "Timestamps",
      icon: <FiCalendar size={20} />,
      fields: [
        { 
          key: 'created_at', 
          label: 'Created At', 
          icon: <FiCalendar size={18} />, 
          formatter: defaultFormatters.dateTime 
        },
        { 
          key: 'updated_at', 
          label: 'Updated At', 
          icon: <FiClock size={18} />, 
          formatter: defaultFormatters.dateTime 
        }
      ]
    }
  ] as SectionConfig<EmployeeDetails>[]
};

export const EmployeeDetailsModal = ({ 
  employee, 
  onClose, 
  isOpen 
}: { 
  employee: EmployeeDetails | null; 
  onClose: () => void; 
  isOpen: boolean 
}) => {
  if (!employee) {
    return null;
  }
  
  return (
    <DetailsModal<EmployeeDetails>
      data={employee}
      onClose={onClose}
      isOpen={isOpen}
      config={{
        ...employeeDetailsConfig,
        header: createHeaderConfig(employee)
      }}
    />
  );
};