import React from "react";
import {
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiEye,
} from "react-icons/fi";
import { RecordWithId } from "@/hooks/useCrudManager";

type ActionableRecord = RecordWithId & {
  status?: boolean | string | null; // Allow both boolean and string status
};

// Define a flexible TableAction type that can work with any record type
export interface TableAction<T = unknown> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T, index?: number) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: (record: T) => boolean;
  hidden?: (record: T) => boolean;
  // Additional properties that might be used by the DataTable
  [key: string]: unknown;
}

// Defines the shape of the handlers that a page component will provide.
// The helper is now generic over `V`, which represents the data type in the table row (e.g., UserProfileData)
interface StandardActionHandlers<V extends ActionableRecord> {
  onView?: (record: V) => void;
  onEdit?: (record: V) => void;
  onToggleStatus?: (record: V) => void;
  onDelete?: (record: V) => void;

  canEdit?: (record: V) => boolean;
  canDelete?: (record: V) => boolean;
}
/**
 * Creates a standardized array of TableAction objects for CRUD operations.
 * This ensures all tables have consistent icons, labels, variants, and behaviors.
 * @param handlers - An object containing the onClick handlers and optional logic for the actions.
 * @returns An array of TableAction<T> objects.
 */
export function createStandardActions<V extends ActionableRecord>({
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  canEdit = () => true, // By default, all actions are enabled
  canDelete = () => true,
}: StandardActionHandlers<V>): TableAction<V>[] {
  const actions: TableAction<V>[] = [];

  // Narrower type guard: only treat records with a boolean `status` as toggle-able
  const hasBooleanStatus = (record: V): record is V & { status: boolean } =>
    typeof (record as unknown as V)?.status === "boolean";

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
