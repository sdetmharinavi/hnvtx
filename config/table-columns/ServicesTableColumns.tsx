// config/table-columns/ServicesTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const ServicesTableColumns = (data: V_servicesRowSchema[], duplicates?: Set<string>) => {
  return useDynamicColumnConfig('v_services', {
    data: data,
    omit: [
      'created_at',
      'updated_at',
      'node_id',
      'end_node_id', // Omit raw IDs
      'link_type_id',
      'maintenance_area_name',
      'id',
      'end_node_name' // Omit standalone column, we combine it below
    ],
    overrides: {
      name: {
        title: 'Service Name',
        sortable: true,
        searchable: true,
        width: 250,
        render: (value, record) => {
          const strValue = String(value ?? '');
          
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
        title: 'Route / Location',
        sortable: true,
        searchable: true,
        width: 280,
        // NEW RENDERER: Shows "Start -> End"
        render: (value, record) => {
           const start = value as string;
           const end = record.end_node_name;
           
           if (start && end) {
               return (
                   <div className="flex items-center gap-2 text-sm">
                       <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={start}>{start}</span>
                       <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                       <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={end}>{end}</span>
                   </div>
               )
           }
           return <span className="text-gray-600 dark:text-gray-400">{start || 'Unknown Location'}</span>;
        }
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