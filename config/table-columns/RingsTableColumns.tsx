import {StatusBadge} from '@/components/common/ui/badges/StatusBadge';
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { RingRowsWithRelations } from "@/types/relational-row-types";
import { RingTypeRowsWithCount } from '@/types/view-row-types';

// Extend the Row type to include the ring_type relation


export const RingsColumns = () => {
  return useDynamicColumnConfig("v_rings_with_count", {
    omit: ["id", "created_at", "updated_at"],
    overrides: {
      name: {
        render: (value: unknown) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      description: {
        render: (value: unknown) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      total_nodes: {
        render: (value: unknown) => {
          return <span className="font-semibold">{value as string}</span>;
        },
      },
      // ring_type_id: {
      //   // We keep the dataIndex as the *_id column (since it's in TABLE_COLUMN_KEYS),
      //   // but read the display value from the joined relation available on the record.
      //   // The page query loads: "ring_type:ring_type_id(id, code)"
      //   render: (_value: unknown, record: RingRowsWithRelations) => {
      //     const rel = record.ring_type;
      //     return rel?.code ?? 'N/A';
      //   },
      // },
      // maintenance_terminal_id: {
      //   // The page query loads: "maintenance_terminal:maintenance_terminal_id(id,name)"
      //   render: (_value: unknown, record: RingRowsWithRelations) => {
      //     const rel = record.maintenance_terminal;
      //     return rel?.name ?? 'N/A';
      //   },
      // },
      ring_type_id: {
        render: (value: unknown, record: RingTypeRowsWithCount) => {
          console.log("value", record);
          
          return <span className="font-semibold">{value  as string}</span>;
        },
      },
      maintenance_terminal_id: {
        render: (value: unknown) => {
          return <span className="font-semibold">{value  as string}</span>;
        },
      },
      status: {
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
}
;