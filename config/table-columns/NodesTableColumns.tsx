import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { NodeRowsWithCount } from '@/types/view-row-types';
import { StatusBadge } from '@/components/common/ui';

export const NodesTableColumns = (data: Row<'v_nodes_complete'>[]) => {
  return useDynamicColumnConfig('v_nodes_complete', {
    data: data,
    omit: [
      'node_type_id',
      'node_type_code',
      'maintenance_area_code',
      'id',
      'maintenance_terminal_id',
      'created_at',
      'updated_at',
      'total_count',
      'active_count',
      'inactive_count',
    ],
    overrides: {
      name: {
        render: (value: unknown) => {
          return (
            <TruncateTooltip
              text={(value as string) ?? ''}
              className="font-semibold"
            />
          );
        },
      },
      maintenance_area_name: {
        title: 'Maintenance Area',
        render: (_value: unknown, record: NodeRowsWithCount) => {
          const rel = record.maintenance_area_name;
          return (
            <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />
          );
        },
      },
      status: {
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};
