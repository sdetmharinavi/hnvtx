// path: config/table-columns/PortsManagementTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatDate } from '@/utils/formatters';


export const PortsManagementTableColumns = (data: V_ports_management_completeRowSchema[]) => {
  return useDynamicColumnConfig('v_ports_management_complete', {
    data: data,
    omit: ['id','system_name', 'system_id','port_type_name','port_capacity', 'port_type_id'],
    overrides: {
      system_name: {
        title: 'System',
        render: (value) => <TruncateTooltip text={value as string} />,
      },
      port: {
        title: 'Port',
        sortable: true,
        naturalSort: true, // Ensure ports like 1.1, 1.2, 1.10 sort correctly
        render: (value) => <span className="font-mono font-medium">{value as string}</span>,
      },
      port_type_name: {
        title: 'Port Type',
      },
      port_type_code: {
        title: 'Port Type',
        sortable: true,
      },
      port_capacity: {
        title: 'Capacity',
      },
      sfp_serial_no: {
        title: 'SFP Serial No.',
        render: (value) => <span className="font-mono text-xs">{value as string}</span>,
      },
      // ADDED: New Columns Renderers
      port_utilization: {
        title: 'Utilization',
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              value
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-700 dark:text-emerald-400'
            }`}
          >
            {value ? 'In Use' : 'Free'}
          </span>
        ),
      },
      port_admin_status: {
        title: 'Admin Status',
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              value
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}
          >
            {value ? 'Up' : 'Down'}
          </span>
        ),
      },
      services_count: {
        title: 'Services',
        sortable: true,
        render: (value) => <span className="font-mono font-semibold">{value as number}</span>,
      },
      created_at: {
        title: 'Created At',
        sortable: true,
        render: (value) => formatDate(value as string),
      },
      updated_at: {
        title: 'Updated At',
        sortable: true,
        render: (value) => formatDate(value as string),
      },
    },
  });
};