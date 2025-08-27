import { Row } from "@/hooks/database";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import TruncateTooltip from "@/components/common/TruncateTooltip";
import { NodeRowsWithCount } from "@/types/view-row-types";
import { StatusBadge } from "@/components/common/ui";

export const NodesTableColumns = (data: Row<"v_nodes_complete">[]) => {
  return useDynamicColumnConfig("v_nodes_complete", {
    data: data,
    omit: [
      "id",
      "created_at",
      "updated_at",
      "active_count",
      "inactive_count",
      "total_count",
      "maintenance_terminal_id",
    ],
    overrides: {
      name: {
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ""} className='font-semibold' />;
        },
      },
      ring_name: {
        title: "Ring",
        render: (_value: unknown, record: NodeRowsWithCount) => {
          const rel = record.ring_name;
          return <TruncateTooltip text={rel ?? "N/A"} className='font-semibold' />;
        },
      },
      maintenance_area_name: {
        title: "Maintenance Area",
        render: (_value: unknown, record: NodeRowsWithCount) => {
          const rel = record.maintenance_area_name;
          return <TruncateTooltip text={rel ?? "N/A"} className='font-semibold' />;
        },
      },
      status: {
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};
