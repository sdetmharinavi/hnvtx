// config/table-columns/ServicesTableColumns.tsx
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { V_servicesRowSchema } from "@/schemas/zod-schemas";
import TruncateTooltip from "@/components/common/TruncateTooltip";

// THE FIX: Changed the input type from ServicesRowSchema[] to V_servicesRowSchema[]
// This matches the data returned by the useServicesData hook (which queries the view).
export const ServicesTableColumns = (data: V_servicesRowSchema[]) => {
  return useDynamicColumnConfig("v_services", {
    data: data,
    // Omit internal IDs and timestamps
    omit: ["id", "created_at", "updated_at", "node_id", "link_type_id", "maintenance_area_name"],
    overrides: {
      name: {
        title: "Service Name",
        sortable: true,
        searchable: true,
        width: 250,
        render: (value) => <TruncateTooltip text={value as string} className="font-semibold" />
      },
      node_name: {
        title: "Node Location",
        sortable: true,
        searchable: true,
        width: 200,
      },
      link_type_name: {
        title: "Link Type",
        sortable: true,
        width: 150,
      },
      bandwidth_allocated: {
        title: "Bandwidth",
        width: 120,
      },
      vlan: {
        title: "VLAN",
        width: 100,
      },
      status: {
        title: "Status",
        width: 120,
        render: (value) => <StatusBadge status={value as boolean} />,
      },
      description: {
        title: "Description",
        width: 250,
        render: (value) => <TruncateTooltip text={value as string} />
      }
    },
  });
};