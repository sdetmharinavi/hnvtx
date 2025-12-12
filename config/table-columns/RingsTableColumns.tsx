// path: config/table-columns/RingsTableColumns.tsx
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { V_ringsRowSchema } from "@/schemas/zod-schemas";

// Helper to render phase status badges
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PhaseBadge = ({ value, type }: { value: unknown, type: 'spec' | 'ofc' | 'bts' }) => {
    const status = value as string || 'Pending';
    let color = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';

    if (status === 'Ready' || status === 'Issued' || status === 'On-Air') {
        color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    } else if (status === 'Blowing' || status === 'Splicing' || status === 'Survey' || status === 'Integrated') {
        color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
            {status}
        </span>
    );
}

export const RingsColumns = (data: V_ringsRowSchema[]) => {
  return useDynamicColumnConfig("v_rings", {
    data: data,
    omit: [
      "id",
      "created_at",
      "updated_at",
      "maintenance_terminal_id",
      "ring_type_id",
      "ring_type_code",
      "ring_type_name",
      "is_closed_loop",
      "description", // Hide description in main table to save space, viewable in modal or tooltip
      "topology_config" // Hide technical config
    ],
    overrides: {
      name: {
        width: 200,
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ""} className='font-semibold' />;
        },
      },
      total_nodes: {
        title: "Nodes",
        width: 80,
        render: (value: unknown) => {
          return <span className='font-mono text-center block'>{value as string}</span>;
        },
      },
      ring_type_code: {
        title: "Type",
        width: 100,
        render: (_value: unknown, record: V_ringsRowSchema) => {
          const rel = record.ring_type_code;
          return <span className="text-xs font-medium bg-gray-50 px-2 py-1 rounded">{rel ?? "N/A"}</span>;
        },
      },
      maintenance_area_name: {
        title: "Area",
        width: 150,
        render: (_value: unknown, record: V_ringsRowSchema) => {
          const rel = record.maintenance_area_name;
          return <TruncateTooltip text={rel ?? "N/A"} />;
        },
      },
      // New Columns
      spec_status: {
          title: "SPEC",
          width: 100,
          render: (val) => <PhaseBadge value={val} type="spec" />
      },
      ofc_status: {
          title: "OFC",
          width: 100,
          render: (val) => <PhaseBadge value={val} type="ofc" />
      },
      bts_status: {
          title: "WORKING STATUS",
          width: 100,
          render: (val) => <PhaseBadge value={val} type="bts" />
      },
      status: {
        width: 100,
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};