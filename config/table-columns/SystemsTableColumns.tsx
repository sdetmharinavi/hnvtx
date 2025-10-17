import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui';
import { FiMapPin } from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';

export const SystemsTableColumns = (data: V_systems_completeRowSchema[]) => {
  return useDynamicColumnConfig('v_systems_complete', {
    data: data as Row<'v_systems_complete'>[],
    omit: [
      "id",
      "node_type_name",
      "system_type_name",
      // "is_ring_based",
      "ring_id",
      "system_type_id",
      "node_id",
      "maintenance_terminal_id",
      "make",
      "remark",
      "s_no",
      "latitude",
      "longitude",
      "ring_logical_area_name",
      "system_category",
      "system_maintenance_terminal_name",
      // "system_type_code",
      "updated_at",
      "created_at",
    ],
    overrides: {
      system_name: {
        key: 'system_name',
        title: 'Name',
        dataIndex: 'system_name',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 200,
        render: (value, record) => {
          const stringValue = value as string; // Type assertion since we know it will be a string
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-white">{stringValue}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">S/N: {record.s_no}</span>
            </div>
          );
        },
      },
      system_type_name: {
        key: 'system_type_name',
        title: 'Type',
        dataIndex: 'system_type_name',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 150,
      },
      node_name: {
        key: 'node_name',
        title: 'Node / Location',
        dataIndex: 'node_name',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 150,
        render: (value) => (
          <div className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3 text-gray-400" />
            <span>{(value as string) || 'N/A'}</span>
          </div>
        ),
      },
      ip_address: {
        key: 'ip_address',
        title: 'IP Address',
        dataIndex: 'ip_address',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 180,
        render: (value) => (
          <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
            {(value as string) || 'N/A'}
          </code>
        ),
      },
      is_ring_based: {
        key: 'is_ring_based',
        title: 'Is Ring Based',
        dataIndex: 'is_ring_based',
        width: 150,
      },
      order_in_ring: {
        key: 'order_in_ring',
        title: 'Order In Ring',
        dataIndex: 'order_in_ring',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 150,
      },
      system_type_code: {
        key: 'system_type_code',
        title: 'System Type',
        dataIndex: 'system_type_code',
        width: 150,
      },
      status: {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 150,
        render: (value) => <StatusBadge status={value as boolean} />,
      },
      commissioned_on: {
        key: 'commissioned_on',
        title: 'Commissioned On',
        dataIndex: 'commissioned_on',
        sortable: true,
        searchable: true,
        filterable: true,
        width: 150,
        render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }),
      },
    },
  });
};
