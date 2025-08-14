import { FiEdit, FiEye, FiTrash2 } from "react-icons/fi";
import { TableAction } from "@/components/table/datatable-types";

interface UserTableActionsProps {
  isSuperAdmin: boolean;
  onEdit: (userId: string) => void;
  onView: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const getUserTableActions = ({
  isSuperAdmin,
  onEdit,
  onView,
  onDelete,
}: UserTableActionsProps): TableAction<"v_user_profiles_extended">[] => [
  {
    key: "edit",
    label: "Edit",
    icon: <FiEdit className='w-4 h-4' />,
    onClick: (record) => onEdit(record.id || ""),
    variant: "primary",
  },
  {
    key: "view",
    label: "View",
    icon: <FiEye className='w-4 h-4' />,
    onClick: (record) => onView(record.id || ""),
    variant: "secondary",
  },
  {
    key: "delete",
    label: "Delete",
    icon: <FiTrash2 className='w-4 h-4' />,
    onClick: async (record) => onDelete(record.id || ""),
    variant: "danger",
    disabled: (record) => !isSuperAdmin || !!record.is_super_admin,
    hidden: () => !isSuperAdmin,
  },
];