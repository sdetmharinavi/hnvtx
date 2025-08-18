// components/ofc/OfcTableActions.ts

import { FiEdit, FiTrash2, FiToggleRight, FiEye } from "react-icons/fi";
import { TableAction } from "@/components/table/datatable-types";
import { Row } from "@/hooks/database";

interface OfcTableActionsProps {
  onView: (ofcId: string) => void;
  onEdit: (ofcId: string) => void;
  // FIX: The record is from the view, so we use the view's Row type
  onToggleStatus: (record: Row<"v_ofc_cables_complete">) => void;
  onDelete: (ofcId: string, displayName?: string) => void;
  isSuperAdmin: boolean;
}

// FIX: The function returns actions for the VIEW, not the base table.
export const GetOfcTableActions = ({
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  isSuperAdmin,
}: OfcTableActionsProps): TableAction<"v_ofc_cables_complete">[] => {
  return [
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
    ...(isSuperAdmin ? [{
      key: "delete" as const,
      label: "Delete",
      icon: <FiTrash2 className='w-4 h-4' />,
      onClick: (record: Row<"v_ofc_cables_complete">) => onDelete(record.id || "", String(record.asset_no || "this ofc cable")),
      variant: "danger" as const,
    }] : [])
  ];
};