import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { AlertCircle } from 'lucide-react';

export const NodesTableColumns = (
  data: V_nodes_completeRowSchema[],
  duplicateSet?: Set<string>
) => {
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
          const strValue = String(value);
          const isDuplicate = duplicateSet?.has(strValue);
          return (
            <div className="flex items-center gap-2 max-w-full">
              <TruncateTooltip
                text={strValue}
                className={`font-semibold ${
                  isDuplicate ? 'text-amber-700 dark:text-amber-400' : ''
                }`}
              />
              {isDuplicate && (
                <div className="shrink-0 group relative">
                  <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                  {/* Simple Tooltip for Duplicate */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    Duplicate Entry
                  </span>
                </div>
              )}
            </div>
          );
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
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-full whitespace-normal wrap-wrap-break-word">
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
