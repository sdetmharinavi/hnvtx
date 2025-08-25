import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiEye } from "react-icons/fi";
import { TableAction } from "@/components/table/datatable-types";
import { Row, TableName } from "@/hooks/database";
import React from "react";

// Defines the shape of the handlers that a page component will provide.
// All handlers are optional, so a page can pick and choose which actions it needs.
interface StandardActionHandlers<T extends TableName> {
  onView?: (record: Row<T>) => void;
  onEdit?: (record: Row<T>) => void;
  onToggleStatus?: (record: Row<T>) => void;
  onDelete?: (record: Row<T>) => void;

  // Optional functions to control the disabled/hidden state dynamically per row.
  canEdit?: (record: Row<T>) => boolean;
  canDelete?: (record: Row<T>) => boolean;
}

/**
 * Creates a standardized array of TableAction objects for CRUD operations.
 * This ensures all tables have consistent icons, labels, variants, and behaviors.
 * @param handlers - An object containing the onClick handlers and optional logic for the actions.
 * @returns An array of TableAction<T> objects.
 */
export function createStandardActions<T extends TableName>({
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  canEdit = () => true, // By default, all actions are enabled
  canDelete = () => true,
}: StandardActionHandlers<T>): TableAction<T>[] {
  const actions: TableAction<T>[] = [];

  // Narrower type guard: only treat records with a boolean `status` as toggle-able
  const hasBooleanStatus = (record: Row<T>): record is Row<T> & { status: boolean } => typeof (record as any)?.status === "boolean";

  // --- Toggle Status Actions (Activate/Deactivate) ---
  if (onToggleStatus) {
    actions.push(
      {
        key: "activate",
        label: "Activate",
        icon: React.createElement(FiToggleRight),
        // Hide if no boolean status, or already active
        hidden: (record) => !hasBooleanStatus(record) || !!record.status,
        onClick: (record) => onToggleStatus(record),
        variant: "success",
      },
      {
        key: "deactivate",
        label: "Deactivate",
        icon: React.createElement(FiToggleLeft),
        // Hide if no boolean status, or already inactive
        hidden: (record) => !hasBooleanStatus(record) || !record.status,
        onClick: (record) => onToggleStatus(record),
        variant: "secondary",
      }
    );
  }

  // --- View Action ---
  if (onView) {
    actions.push({
      key: "view",
      label: "View Details",
      icon: React.createElement(FiEye),
      onClick: (record) => onView(record),
      variant: "secondary",
    });
  }

  // --- Edit Action ---
  if (onEdit) {
    actions.push({
      key: "edit",
      label: "Edit",
      icon: React.createElement(FiEdit2),
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
      icon: React.createElement(FiTrash2),
      onClick: (record) => onDelete(record),
      variant: "danger",
      disabled: (record) => !canDelete(record),
    });
  }

  return actions;
}
