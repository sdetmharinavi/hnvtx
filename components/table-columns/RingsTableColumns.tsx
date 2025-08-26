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
        // We keep the dataIndex as the *_id column (since it's in TABLE_COLUMN_KEYS),
        // but read the display value from the joined relation available on the record.
        // The page query loads: "ring_type:ring_type_id(id, code)"
        render: (_value, record) => {
          const rel = (record as any)?.ring_type;
          return rel?.code ?? 'N/A';
        },
      },
      maintenance_terminal_id: {
        // The page query loads: "maintenance_terminal:maintenance_terminal_id(id,name)"
        render: (_value, record) => {
          const rel = (record as any)?.maintenance_terminal;
          return rel?.name ?? 'N/A';
        },
      },
      status: {
        render: (value) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
}
;