import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';

export const NodesTableColumns = (data: V_nodes_completeRowSchema[]) => {
  return useDynamicColumnConfig('v_nodes_complete', {
    data: data,
    omit: [
      'node_type_id',
      'id',
      'maintenance_terminal_id',
      'created_at',
      'updated_at',
      'node_type_name',
    ],
    overrides: {
      name: {
        sortable: true,
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ''} className="font-semibold" />;
        },
      },
      latitude: {
        sortable: true,
        title: 'Latitude',
      },
      longitude: {
        sortable: true,
        title: 'Longitude',
      },
      maintenance_area_name: {
        title: 'Maintenance Area',
        sortable: true,
        render: (_value: unknown, record: V_nodes_completeRowSchema) => {
          const rel = record.maintenance_area_name;
          return <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />;
        },
      },
      remark: {
        sortable: true,
        editable: true,
        width: 200,
        render: (value: unknown) => {
          return (
            <div className="flex flex-col">
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-full whitespace-normal break-words">
                {(value as string) ?? ''}
              </p>
            </div>
          );
        },
      },
      status: {
        sortable: true,
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};
