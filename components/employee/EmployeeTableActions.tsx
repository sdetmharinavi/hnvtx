import { FiEdit, FiTrash2, FiToggleRight, FiEye } from "react-icons/fi";
import { TableAction } from "@/components/table/datatable-types";
import { Row } from "@/hooks/database";

interface EmployeeTableActionsProps {
  onView: (employeeId: string) => void;
  onEdit: (employeeId: string) => void;
  onToggleStatus: (record: Row<"employees">) => void;
  onDelete: (employeeId: string, displayName?: string) => void;
}

export const getEmployeeTableActions = ({
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: EmployeeTableActionsProps): TableAction<"employees">[] => [
  {
    key: "view",
    label: "View",
    icon: <FiEye className='w-4 h-4' />,
    onClick: (record) => onView(record.id || ""),
    variant: "primary",
  },
  {
    key: "toggle",
    label: "Toggle Status",
    icon: <FiToggleRight className='w-4 h-4' />,
    onClick: (record) => onToggleStatus(record),
    variant: "secondary",
  },
  {
    key: "edit",
    label: "Edit",
    icon: <FiEdit className='w-4 h-4' />,
    onClick: (record) => onEdit(record.id || ""),
    variant: "primary",
  },
  {
    key: "delete",
    label: "Delete",
    icon: <FiTrash2 className='w-4 h-4' />,
    onClick: (record) => onDelete(record.id || "", String(record.employee_name || "this employee")),
    variant: "danger",
  },
];
