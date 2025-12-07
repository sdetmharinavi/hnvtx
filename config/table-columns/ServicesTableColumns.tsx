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
        // UPDATED RENDERER
        render: (value, record) => {
          const strValue = String(value ?? '');
          
          // Generate composite key: Name + Link Type (normalized)
          // Must match the logic in the Page component
          const namePart = strValue.trim().toLowerCase();
          const typePart = (record.link_type_name || '').trim().toLowerCase();
          const compositeKey = `${namePart}|${typePart}`;

          const isDuplicate = duplicates?.has(compositeKey);

          return (
            <div className="flex items-center gap-2 max-w-full">
              <TruncateTooltip
                text={strValue}
                className={`font-semibold ${
                  isDuplicate ? 'text-amber-700 dark:text-amber-400' : ''
                }`}
              />
              {isDuplicate && (
                <div 
                   className="shrink-0 cursor-help" 
                   title={`Duplicate Entry: Another service exists with name "${strValue}" and type "${record.link_type_name}".`}
                >
                   <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
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