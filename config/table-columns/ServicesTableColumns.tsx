// config/table-columns/ServicesTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { AlertCircle } from 'lucide-react';

export const ServicesTableColumns = (data: V_servicesRowSchema[], duplicates?: Set<string>) => {
  return useDynamicColumnConfig('v_services', {
    data: data,
    omit: [
      'created_at',
      'updated_at',
      'node_id',
      'link_type_id',
      'maintenance_area_name',
      'node_id',
      'link_type_id',
      'maintenance_area_name',
      'id',
    ],
    overrides: {
      name: {
        title: 'Service Name',
        sortable: true,
        searchable: true,
        width: 250,
        render: (value) => {
          const strValue = String(value);
          const isDuplicate = duplicates?.has(strValue);

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
      node_name: {
        title: 'Node Location',
        sortable: true,
        searchable: true,
        width: 200,
      },
      link_type_name: {
        title: 'Link Type',
        sortable: true,
        width: 150,
      },
      bandwidth_allocated: {
        title: 'Bandwidth',
        width: 90,
        sortable: true,
      },
      vlan: {
        title: 'VLAN',
        width: 100,
        sortable: true,
        searchable: true,
      },
      unique_id: {
        title: 'Unique ID',
        width: 90,
        sortable: true,
        searchable: true,
      },
      status: {
        title: 'Status',
        width: 120,
        sortable: true,
        render: (value) => <StatusBadge status={value as boolean} />,
      },
      description: {
        title: 'Description',
        width: 200,
        searchable: true,
        render: (value) => <TruncateTooltip text={value as string} />,
      },
    },
  });
};
