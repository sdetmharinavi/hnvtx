// path: config/table-columns/PortsManagementTableColumns.tsx
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import TruncateTooltip from '@/components/common/TruncateTooltip';

export const PortsManagementTableColumns = (data: V_ports_management_completeRowSchema[]) => {
  return useDynamicColumnConfig('v_ports_management_complete', {
    data: data,
    omit: ['id', 'system_id', 'port_type_id'],
    overrides: {
      system_name: {
        title: 'System',
        render: (value) => <TruncateTooltip text={value as string} />,
      },
      port: {
        title: 'Port',
        render: (value) => <span className="font-mono">{value as string}</span>,
      },
      port_type_name: {
        title: 'Port Type',
      },
      port_capacity: {
        title: 'Capacity',
      },
      sfp_serial_no: {
        title: 'SFP Serial No.',
        render: (value) => <span className="font-mono text-xs">{value as string}</span>,
      },
    },
  });
};