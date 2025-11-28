import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { V_ringsRowSchema } from "@/schemas/zod-schemas";

// Helper to safely parse and render topology config
const TopologyConfigCell = ({ value }: { value: unknown }) => {
  if (!value) {
    return (
      <span className="text-gray-400 dark:text-gray-500 italic text-sm">
        Standard
      </span>
    );
  }

  try {
    const config = typeof value === 'string' ? JSON.parse(value) : value;
    
    if (typeof config === 'object' && config !== null) {
      // Check for disabled segments array
      if (Array.isArray(config.disabled_segments) && config.disabled_segments.length > 0) {
        const count = config.disabled_segments.length;
        return (
          <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1.5 rounded-md text-xs font-medium border border-amber-200 dark:border-amber-800/40 shadow-sm">
            <span>
              {count} Segment{count !== 1 ? 's' : ''} Disabled
            </span>
          </div>
        );
      }
    }
    
    // If object exists but empty or no specific keys found
    if (Object.keys(config).length === 0) {
      return (
        <span className="text-gray-400 dark:text-gray-500 italic text-sm">
          Standard
        </span>
      );
    }

    // Fallback for other config types
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
        Custom Config
      </span>
    );
  } catch {
    return (
      <span className="text-gray-400 dark:text-gray-500 italic text-sm">
        Standard
      </span>
    );
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
      "ring_type_name",
      "is_closed_loop"
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
      is_closed_loop: {
        title: "Closed Loop",
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};