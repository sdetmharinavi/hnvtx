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
  
  // Employee details modal configuration
  export const employeeDetailsConfig = {
    header: {
      title: (emp: any) => emp.employee_name || "Unnamed Employee",
      subtitle: (emp: any) => emp.employee_pers_no || "No Personnel No.",
      avatar: {
        urlKey: '', // employees don’t have avatars
        fallbackText: (emp: any) => (emp.employee_name?.charAt(0)?.toUpperCase() || "?")
      },
      badges: [
        {
          key: 'employee_designations.name',
          component: (designation: string) => designation ? (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {designation}
            </span>
          ) : null
        },
        {
          key: 'status',
          component: (status: boolean) => (
            <StatusBadge status={status ? "ACTIVE" : "INACTIVE"} />
          )
        }
      ]
    } as HeaderConfig,
  
    sections: [
      {
        title: "Personal Information",
        icon: <FiUser size={20} />,
        fields: [
          { key: 'employee_name', label: 'Full Name', icon: <FiUser size={18} /> },
          { key: 'employee_pers_no', label: 'Personnel No.', icon: <FiInfo size={18} /> },
          { key: 'employee_contact', label: 'Contact No.', icon: <FiPhone size={18} /> },
          { 
            key: 'employee_email', 
            label: 'Email Address', 
            icon: <FiMail size={18} />, 
            formatter: (email: string, data: any) => email || "Not Provided" 
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
          }
        ]
      },
      {
        title: "Employment Details",
        icon: <FiBriefcase size={20} />,
        fields: [
          { 
            key: 'employee_designations.name', 
            label: 'Designation', 
            icon: <FiBriefcase size={18} /> 
          },
          { 
            key: 'maintenance_terminal_id', 
            label: 'Maintenance Terminal ID', 
            icon: <FiInfo size={18} /> 
          },
          { 
            key: 'remark', 
            label: 'Remark', 
            icon: <FiInfo size={18} /> 
          }
        ]
      },
      {
        title: "Address",
        icon: <FiMapPin size={20} />,
        condition: (emp: any) => !!emp.employee_addr,
        renderCustom: (emp: any) => (
          <div className=" bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
              {emp.employee_addr}
            </p>
          </div>
        )
      },
      {
        title: "Timestamps",
        icon: <FiCalendar size={20} />,
        fields: [
          { key: 'created_at', label: 'Created At', icon: <FiCalendar size={18} />, formatter: defaultFormatters.dateTime },
          { key: 'updated_at', label: 'Updated At', icon: <FiClock size={18} />, formatter: defaultFormatters.dateTime }
        ]
      }
    ] as SectionConfig[]
  };
  
  export const EmployeeDetailsModal = ({ employee, onClose, isOpen }: { employee: any, onClose: () => void, isOpen: boolean }) => {
    return (
      <DetailsModal
        data={employee}
        onClose={onClose}
        isOpen={isOpen}
        config={employeeDetailsConfig}
      />
    );
  };
  