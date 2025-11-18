import React from "react";
import {
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
} from "lucide-react";
import { RecordWithId } from "@/hooks/useCrudManager";

type ActionableRecord = RecordWithId & {
  status?: boolean | string | null;
};

// Define a flexible TableAction type that can work with any record type
export interface TableAction<T = unknown> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  getIcon?: (record: T) => React.ReactNode;
  onClick: (record: T, index?: number) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean | ((record: T) => boolean);
  hidden?: boolean | ((record: T) => boolean);
  [key: string]: unknown;
}

interface StandardActionHandlers<V extends ActionableRecord> {
  onView?: (record: V) => void;
  onEdit?: (record: V) => void;
  onToggleStatus?: (record: V) => void;
  onDelete?: (record: V) => void;
  canEdit?: (record: V) => boolean;
  canDelete?: (record: V) => boolean;
}

export function createStandardActions<V extends ActionableRecord>({
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  canEdit = () => true,
  canDelete = () => true,
}: StandardActionHandlers<V>): TableAction<V>[] {
  const actions: TableAction<V>[] = [];

  const hasBooleanStatus = (record: V): record is V & { status: boolean } =>
    typeof (record as unknown as V)?.status === "boolean";

  // --- Toggle Status Actions (Activate/Deactivate) ---
  if (onToggleStatus) {
    actions.push({
      key: "toggleStatus",
      label: "Toggle Status",
      getIcon: (record: V) => 
        React.createElement(record.status ? ToggleRight : ToggleLeft, { 
          className: `w-4 h-4 ${record.status ? 'text-green-500' : 'text-gray-400'}`,
        }),
      variant: 'secondary',
      onClick: (record) => onToggleStatus(record),
      hidden: (record) => !hasBooleanStatus(record)
    });
  }

  // --- View Action ---
  if (onView) {
    actions.push({
      key: "view",
      label: "View Details",
      icon: React.createElement(Eye, { className: "w-4 h-4" }),
      onClick: (record) => onView(record),
      variant: "secondary",
    });
  }

  // --- Edit Action ---
  if (onEdit) {
    actions.push({
      key: "edit",
      label: "Edit",
      icon: React.createElement(Edit2, { className: "w-4 h-4" }),
      onClick: (record) => onEdit(record),
      variant: "primary",
      disabled: (record) => !canEdit(record),
    });
  }

  // --- Delete Action ---
  if (onDelete) {
    actions.push({
      key: "delete",
      label: "Delete",
      icon: React.createElement(Trash2, { className: "w-4 h-4" }),
      onClick: (record) => onDelete(record),
      variant: "danger",
      disabled: (record) => !canDelete(record),
    });
  }

  return actions;
}