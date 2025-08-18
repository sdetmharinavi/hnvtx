import { FiEdit2 } from "react-icons/fi";
// hooks/useNodesTableActions.ts
import { useMemo, createElement } from "react";
import { Row } from "@/hooks/database";
import { NodeWithRelations } from "@/components/nodes/nodes_types";
import { FiToggleRight, FiToggleLeft, FiTrash2 } from "react-icons/fi";

interface UseNodesTableActionsProps {
  onEdit: (node: NodeWithRelations) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  onDelete: (id: string, name: string) => void;
}

export const useNodesTableActions = ({ onEdit, onToggleStatus, onDelete }: UseNodesTableActionsProps) => {
  return useMemo(
    () => [
      {
        key: "edit",
        label: "Edit",
        onClick: (record: Row<"nodes">) => onEdit(record as NodeWithRelations),
        icon: createElement(FiEdit2),
      },
      {
        key: "activate",
        label: "Activate",
        hidden: (r: Row<"nodes">) => Boolean((r as any).status) === true,
        onClick: (r: Row<"nodes">) => onToggleStatus((r as any).id, true),
        icon: createElement(FiToggleRight),
      },
      {
        key: "deactivate",
        label: "Deactivate",
        hidden: (r: Row<"nodes">) => Boolean((r as any).status) === false,
        onClick: (r: Row<"nodes">) => onToggleStatus((r as any).id, false),
        icon: createElement(FiToggleLeft),
      },
      {
        key: "delete",
        label: "Delete",
        variant: "danger" as const,
        onClick: (r: Row<"nodes">) => onDelete((r as any).id, String((r as any).name ?? "this node")),
        icon: createElement(FiTrash2),
      },
    ],
    [onEdit, onToggleStatus, onDelete]
  );
};
