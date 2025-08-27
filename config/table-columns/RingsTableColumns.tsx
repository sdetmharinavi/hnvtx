import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { RingTypeRowsWithCount } from "@/types/view-row-types";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { Row } from "@/hooks/database";

export const RingsColumns = (data: Row<"v_rings_with_count">[]) => {
  return useDynamicColumnConfig("v_rings_with_count", {
    data: data,
    omit: [
      "id",
      "created_at",
      "updated_at",
      "active_count",
      "inactive_count",
      "maintenance_area_area_type_id",
      "maintenance_area_code",
      "maintenance_area_contact_number",
      "maintenance_area_contact_person",
      "maintenance_area_created_at",
      "maintenance_area_email",
      "maintenance_area_latitude",
      "maintenance_area_longitude",
      "maintenance_area_parent_id",
      "maintenance_area_status",
      "maintenance_area_updated_at",
      "ring_type_category",
      "ring_type_created_at",
      "ring_type_id",
      "ring_type_is_system_default",
      "ring_type_name",
      "ring_type_sort_order",
      "ring_type_status",
      "ring_type_updated_at",
      "total_count",
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
        render: (_value: unknown, record: RingTypeRowsWithCount) => {
          const rel = record.ring_type_code;
          return <TruncateTooltip text={rel ?? "N/A"} className='font-semibold' />;
        },
      },
      maintenance_area_name: {
        title: "Maintenance Area",
        render: (_value: unknown, record: RingTypeRowsWithCount) => {
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
