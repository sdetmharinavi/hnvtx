import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui';
import { FiMapPin } from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';
import { Row } from '@/hooks/database';

export const SystemConnectionsTableColumns = (data: Row<'v_system_connections_complete'>[]) => {
  return useDynamicColumnConfig('v_system_connections_complete', {
    data: data,

    omit: [
      'id',
      'system_id',
      'created_at',
      'updated_at',
      'en_interface',
      'sn_interface',
      'en_ip',
      'sn_ip',
      'fiber_in',
      'fiber_out',
      'sdh_a_customer',
      'sdh_a_slot',
      'sdh_b_customer',
      'sdh_b_slot',
      'sdh_carrier',
      'sdh_stm_no',
      'vlan',
      'en_node_name',
      'sn_node_name',
      'media_type_name',
      'remark',
    ],
    overrides: {
      connected_system_name: {
        title: "Connected System",
        sortable: true,
        searchable: true,
        width: 200,
        render: (value,record,index) => {
          const stringValue = value as string;
          const systemType = record.connected_system_type_name;
          return (
            <div key={"connected_system_name"+index} className='flex flex-col'>
              <span className='font-medium text-gray-900 dark:text-white'>{stringValue}</span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>{systemType}</span>
            </div>
          );
        },
      },
      system_name: {
        title: "Source System",
        sortable: true,
        searchable: true,
        width: 180,
      },
      system_type_name: {
        title: "Source Type",
        sortable: true,
        searchable: true,
        width: 150,
      },
      bandwidth: {
        title: "Bandwidth (Mbps)",
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => (
          <span className="font-mono text-sm">
            {value ? `${value} Mbps` : "N/A"}
          </span>
        ),
      },
      bandwidth_allocated: {
        title: "Allocated (Mbps)",
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => (
          <span className="font-mono text-sm">
            {value ? `${value} Mbps` : "N/A"}
          </span>
        ),
      },
      customer_name: {
        title: "Customer",
        sortable: true,
        searchable: true,
        width: 180,
      },
      en_name: {
        title: "End Node",
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => (
          <div className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3 text-gray-400" />
            <span>{value as string || "N/A"}</span>
          </div>
        ),
      },
      sn_name: {
        title: "Start Node",
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => (
          <div className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3 text-gray-400" />
            <span>{value as string || "N/A"}</span>
          </div>
        ),
      },
      status: {
        title: "Status",
        sortable: true,
        searchable: true,
        width: 120,
        render: (value) => <StatusBadge status={value as boolean} />
      },
      commissioned_on: {
        title: "Commissioned On",
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }),
      },
    },
  });
};
