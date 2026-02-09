// path: config/table-columns/PortsManagementTableColumns.tsx
import React from 'react';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import {
  V_ports_management_completeRowSchema,
  V_system_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { Activity, Shield } from 'lucide-react';
import { Row } from '@/hooks/database';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import TruncateTooltip from '@/components/common/TruncateTooltip';

// Define the structure for our service mapping
export type PortServiceMap = Record<string, V_system_connections_completeRowSchema[]>;

export const PortsManagementTableColumns = (
  data: V_ports_management_completeRowSchema[],
  portServicesMap?: PortServiceMap,
) => {
  // 1. Generate base columns from the hook
  const columns = useDynamicColumnConfig('v_ports_management_complete', {
    data: data,
    omit: [
      'id',
      'system_id',
      'port_type_id',
      'services_count',
      'created_at',
      'updated_at',
      'system_name',
      'port_type_name',
      'port_capacity',
    ],
    overrides: {
      port: {
        title: 'Port',
        width: 140,
        render: (value) => (
          <span className='font-mono font-bold text-gray-800 dark:text-gray-200'>
            {value as string}
          </span>
        ),
        sortable: true,
        naturalSort: true,
      },
      sfp_serial_no: {
        title: 'SFP Serial',
        width: 150,
        render: (value) =>
          value ? (
            <span className='font-mono text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700'>
              {value as string}
            </span>
          ) : (
            <span className='text-gray-300 text-xs'>-</span>
          ),
      },
      port_utilization: {
        title: 'State',
        width: 100,
        render: (value) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
              value
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            {value ? 'Used' : 'Free'}
          </span>
        ),
      },
      port_admin_status: {
        title: 'Admin',
        width: 100,
        render: (value) => (
          <div className='flex items-center gap-1.5'>
            <div
              className={`w-2 h-2 rounded-full ${
                value ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                value ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}
            >
              {value ? 'UP' : 'DOWN'}
            </span>
          </div>
        ),
      },
    },
  });

  // 2. Manual Custom Column for Rich Service Display
  const servicesColumn: Column<Row<'v_ports_management_complete'>> = {
    key: 'services_info',
    title: 'Allocated Services',
    dataIndex: 'port',
    width: 350,
    render: (value) => {
      // Removed unused _record parameter
      const portName = value as string;
      if (!portName || !portServicesMap)
        return <span className='text-gray-400 italic text-xs'>No info</span>;

      const services = portServicesMap[portName] || [];

      if (services.length === 0) {
        return <span className='text-gray-300 dark:text-gray-600 text-xs italic'>Unallocated</span>;
      }

      return (
        <div className='flex flex-col gap-1.5 py-1'>
          {services.slice(0, 2).map((svc) => (
            <div
              key={svc.id}
              className='flex items-center gap-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 shadow-sm'
            >
              {/* Role Indicator */}
              {svc.system_working_interface === portName ? (
                <div
                  title='Working Path'
                  className='p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full shrink-0'
                >
                  <Activity size={10} className='text-blue-600 dark:text-blue-400' />
                </div>
              ) : (
                <div
                  title='Protection Path'
                  className='p-1 bg-purple-100 dark:bg-purple-900/50 rounded-full shrink-0'
                >
                  <Shield size={10} className='text-purple-600 dark:text-purple-400' />
                </div>
              )}

              <div className='flex flex-col min-w-0 flex-1'>
                <div className='font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[180px]'>
                  <TruncateTooltip
                    text={svc.service_name || svc.connected_system_name || 'Unknown'}
                    className='truncate'
                  />
                </div>
                <span className='text-[10px] text-gray-500 truncate'>
                  {svc.connected_link_type_name}{' '}
                  {svc.bandwidth_allocated ? `• ${svc.bandwidth_allocated}` : ''}
                </span>
              </div>
            </div>
          ))}
          {services.length > 2 && (
            <span
              className='text-[10px] text-blue-600 dark:text-blue-400 font-medium pl-1 cursor-help'
              title={`${services.length - 2} more services hidden`}
            >
              +{services.length - 2} more services...
            </span>
          )}
        </div>
      );
    },
  };

  // 3. Append the custom column
  return [...columns, servicesColumn];
};
