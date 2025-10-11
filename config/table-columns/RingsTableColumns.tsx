import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { V_ringsRowSchema } from "@/schemas/zod-schemas";

export const RingsColumns = (data: V_ringsRowSchema[]) => {
  return useDynamicColumnConfig("v_rings", {
    data: data,
    omit: [
      "id",
      "created_at",
      "updated_at",
      "maintenance_terminal_id",
    ],
    overrides: {
      name: {
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ""} className='font-semibold' />;
        },
      },
      description: {
        title: "Description",
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ""} className='font-semibold' />;
        },
      },
      total_nodes: {
        title: "Total Nodes",
        render: (value: unknown) => {
          return <span className='font-semibold'>{value as string}</span>;
        },
      },
      ring_type_code: {
        title: "Ring Type",
        render: (_value: unknown, record: V_ringsRowSchema) => {
          const rel = record.ring_type_code;
          return <TruncateTooltip text={rel ?? "N/A"} className='font-semibold' />;
        },
      },
      maintenance_area_name: {
        title: "Maintenance Area",
        render: (_value: unknown, record: V_ringsRowSchema) => {
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
