import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { V_ringsRowSchema } from "@/schemas/zod-schemas";
import { FiGitMerge } from "react-icons/fi";

// Helper to safely parse and render topology config
const TopologyConfigCell = ({ value }: { value: unknown }) => {
  if (!value) return <span className="text-gray-400 italic">Standard</span>;

  try {
    const config = typeof value === 'string' ? JSON.parse(value) : value;
    
    if (typeof config === 'object' && config !== null) {
      // Check for disabled segments array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((config as any).disabled_segments) && (config as any).disabled_segments.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (config as any).disabled_segments.length;
        return (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-xs font-medium border border-amber-200 dark:border-amber-800/50 w-fit">
            <FiGitMerge className="w-3 h-3" />
            <span>{count} Segment{count !== 1 ? 's' : ''} Disabled</span>
          </div>
        );
      }
    }
    
    // If object exists but empty or no specific keys found
    if (Object.keys(config).length === 0) {
        return <span className="text-gray-400 italic">Standard</span>;
    }

    // Fallback for other config types
    return <span className="text-xs text-gray-500">Custom Config</span>;
  } catch {
    return <span className="text-gray-400 italic">Standard</span>;
  }
};

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
      "ring_type_name"
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
          return <TruncateTooltip renderAsHtml text={(value as string) ?? ""} className='font-semibold' />;
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
      topology_config: {
        title: "Topology",
        render: (value: unknown) => <TopologyConfigCell value={value} />
      },
      status: {
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};