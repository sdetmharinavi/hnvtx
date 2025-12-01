// config/table-columns/ServicesTableColumns.tsx
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { ServicesRowSchema } from "@/schemas/zod-schemas";

export const ServicesTableColumns = (data: ServicesRowSchema[]) => {
  return useDynamicColumnConfig("services", {
    data: data,
    omit: ["id", "created_at", "updated_at", "system_id", "node_id", "link_type_id"],
    overrides: {
      name: {
        title: "Service Name",
        sortable: true,
        searchable: true,
        width: 250,
      },
      services_ip: {
        title: "IP Address",
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
        width: 300,
      }
    },
  });
};