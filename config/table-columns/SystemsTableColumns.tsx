import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { FiMapPin } from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';

export const SystemsTableColumns = (data: Row<'v_systems_complete'>[]) => {
  return useDynamicColumnConfig('v_systems_complete', {
    data: data,
    omit: [
 
    ],
    overrides: {
      system_name:{
            key: "system_name",
            title: "Name",
            dataIndex: "system_name",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 200,
            render: (value: unknown, record: Row<'v_systems_complete'>) => {
              const stringValue = value as string; // Type assertion since we know it will be a string
              return (
                <div className='flex flex-col'>
                  <span className='font-medium text-gray-900 dark:text-white'>{stringValue}</span>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>S/N: {record.s_no}</span>
                </div>
              );
            },
          },
          system_type_name:{
            key: "system_type_name",
            title: "Type",
            dataIndex: "system_type_name",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 150,
          },
          node_name:{
            key: "node_name",
            title: "Node / Location",
            dataIndex: "node_name",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 150,
            render: (value) => (
              <div className="flex items-center gap-1">
                <FiMapPin className="h-3 w-3 text-gray-400" />
                <span>{value as string || "N/A"}</span>
              </div>
            ),
          },
          ip_address:{
            key: "ip_address",
            title: "IP Address",
            dataIndex: "ip_address",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 150,
            render: (value: unknown) => (
              <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
                {value as string || "N/A"}
              </code>
            ),
          },
          status:{
            key: "status",
            title: "Status",
            dataIndex: "status",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 150,
            render: (value) => <StatusBadge status={value as boolean} />
          },
          commissioned_on:{
            key: "commissioned_on",
            title: "Commissioned On",
            dataIndex: "commissioned_on",
            sortable: true,
            searchable: true,
            filterable: true,
            width: 150,
            render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }),
          }
    },
  });
};
