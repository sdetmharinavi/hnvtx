// config/table-columns/LogicalPathsTableColumns.tsx
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { TruncateTooltip } from '@/components/common/TruncateTooltip';
import { Row } from '@/hooks/database';

export const LogicalPathsTableColumns = (data: Row<'v_end_to_end_paths'>[]) => {
  return useDynamicColumnConfig('v_end_to_end_paths', {
    data: data,
    omit: ['path_id', 'source_system_id', 'destination_system_id', 'total_loss_db'],
    overrides: {
      path_name: {
        title: 'Path Name',
        width: 250, // Explicit width to prevent early truncation
        sortable: true,
        searchable: true,
        render: (value) => (
          <TruncateTooltip 
            text={(value as string) ?? 'N/A'} 
            className="font-semibold text-gray-900 dark:text-gray-100 max-w-60 wrap-break-word" 
          />
        ),
      },
      operational_status: {
        title: 'Status',
        width: 120,
        sortable: true,
        render: (value) => <StatusBadge status={(value as string) || 'Unknown'} />,
      },
      segment_count: {
        title: 'Segments',
        width: 100,
        sortable: true,
        render: (value) => <span className="font-mono text-sm">{(value as number) ?? 0}</span>,
      },
      route_names: {
        title: 'Route Path',
        width: 250, // Wide column for route chains
        searchable: true,
        render: (value) => <TruncateTooltip className='max-w-60 wrap-break-word' text={(value as string) ?? 'N/A'} />,
      },
      total_distance_km: {
        title: 'Distance (km)',
        width: 120,
        sortable: true,
        render: (value) => (
          <span className="font-mono text-sm font-medium">{(value as number)?.toFixed(2) ?? '0.00'}</span>
        ),
      },
    },
  });
};
