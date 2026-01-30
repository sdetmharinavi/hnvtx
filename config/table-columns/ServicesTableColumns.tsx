// config/table-columns/ServicesTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { AlertCircle, ArrowRight, Server, ExternalLink } from 'lucide-react';
import React from 'react';

// Define the shape of items in the allocated_systems array
interface AllocatedSystem {
  id: string;
  name: string;
}

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
      'end_node_name', // Omit standalone column, we combine it below
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
            <div className='flex items-center gap-2 max-w-full'>
              <TruncateTooltip
                text={strValue}
                className={`font-semibold ${
                  isDuplicate ? 'text-amber-700 dark:text-amber-400' : ''
                }`}
              />
              {isDuplicate && (
                <div
                  className='shrink-0 cursor-help'
                  title={`Duplicate Entry: Another service exists with name "${strValue}" and type "${record.link_type_name}".`}
                >
                  <AlertCircle className='w-4 h-4 text-amber-500 animate-pulse' />
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
        render: (value, record) => {
          const start = value as string;
          const end = record.end_node_name;

          if (start && end) {
            return (
              <div className='flex items-center gap-2 text-sm'>
                <span
                  className='font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]'
                  title={start}
                >
                  {start}
                </span>
                <ArrowRight className='w-3 h-3 text-gray-400 shrink-0' />
                <span
                  className='font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]'
                  title={end}
                >
                  {end}
                </span>
              </div>
            );
          }
          return (
            <span className='text-gray-600 dark:text-gray-400'>{start || 'Unknown Location'}</span>
          );
        },
      },
      // MODIFIED: Allocated Systems Column with Links
      allocated_systems: {
        title: 'Allotted Systems',
        width: 250,
        render: (value) => {
          const systems = value as AllocatedSystem[] | null;

          if (!systems || systems.length === 0) {
            return <span className='text-xs text-gray-400 italic'>Unassigned</span>;
          }

          if (systems.length === 1) {
            return (
              <a
                href={`/dashboard/systems/${systems[0].id}`}
                target='_blank'
                rel='noopener noreferrer'
                onClick={(e) => e.stopPropagation()} // Stop row click
                className='flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline group'
              >
                <Server className='w-3.5 h-3.5' />
                <span className='truncate max-w-[160px]' title={systems[0].name}>
                  {systems[0].name}
                </span>
                <ExternalLink className='w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity' />
              </a>
            );
          }

          return (
            <div className='flex flex-col gap-1'>
              {systems.slice(0, 9).map((sys) => (
                <a
                  key={sys.id}
                  href={`/dashboard/systems/${sys.id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={(e) => e.stopPropagation()}
                  className='flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline group'
                >
                  <Server className='w-3 h-3 text-blue-500' />
                  <span className='truncate max-w-[180px]' title={sys.name}>
                    {sys.name}
                  </span>
                  <ExternalLink className='w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity' />
                </a>
              ))}
              {systems.length > 9 && (
                <span className='text-[10px] text-gray-500 pl-4'>
                  +{systems.length - 9} more systems
                </span>
              )}
            </div>
          );
        },
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
