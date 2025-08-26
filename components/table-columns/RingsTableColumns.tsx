import {StatusBadge} from '@/components/common/ui/badges/StatusBadge';
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";

export const RingsColumns = () => {
  return useDynamicColumnConfig("rings", {
    omit: ["id", "created_at", "updated_at"],
    overrides: {
      name: {
        render: (value) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      description: {
        render: (value) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      total_nodes: {
        render: (value) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      ring_type_id: {
        render: (value) => {
          // Expecting a joined object from lookup_types or string "N/A"
          if (value && typeof value === 'object' && 'code' in (value as any)) {
            return (value as any).code ?? 'N/A';
          }
          return 'N/A';
        }
      },
      maintenance_terminal_id: {
        render: (value) => {
          // Expecting a joined object from maintenance_areas or string "N/A"
          if (value && typeof value === 'object' && 'name' in (value as any)) {
            return (value as any).name ?? 'N/A';
          }
          return 'N/A';
        }
      },
      status: {
        render: (value) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};