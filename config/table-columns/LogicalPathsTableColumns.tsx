import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { Row } from '@/hooks/database';

export const LogicalPathsTableColumns = (data: Row<'v_end_to_end_paths'>[]) => {
  return useDynamicColumnConfig("v_end_to_end_paths", {
    data: data,
    omit: ["path_id", "source_system_id", "destination_system_id", "total_loss_db"],
    overrides: {
      path_name: {
        title: "Path Name",
        render: (value) => <TruncateTooltip text={(value as string) ?? 'N/A'} className='font-semibold' />,
      },
      operational_status: {
        title: "Status",
        render: (value) => <StatusBadge status={(value as string) || "Unknown"} />,
      },
      segment_count: {
        title: "Segments",
        render: (value) => <span className="font-mono text-sm">{value as number ?? 0}</span>,
      },
      route_names: {
        title: "Route",
        render: (value) => <TruncateTooltip text={(value as string) ?? 'N/A'} />,
      },
      total_distance_km: {
        title: "Distance (km)",
        render: (value) => <span className="font-mono text-sm">{(value as number)?.toFixed(2) ?? '0.00'}</span>,
      },
    },
  });
};