import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { StatusBadge } from '@/components/common/ui';
import { FiMapPin } from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';
import TruncateTooltip from '@/components/common/TruncateTooltip';

// THE FIX: Define a type for the new ring_associations JSON structure.
interface RingAssociation {
  ring_id: string;
  ring_name: string;
  order_in_ring: number;
}

export const SystemsTableColumns = (data: V_systems_completeRowSchema[]) => {
  return useDynamicColumnConfig('v_systems_complete', {
    data: data as Row<'v_systems_complete'>[],
    omit: [
      'id',
      'node_type_name',
      'system_type_name',
      'is_ring_based',
      'ring_id', // Omit the old single ring_id
      'order_in_ring', // Omit the old single order_in_ring
      'system_type_id',
      'node_id',
      'maintenance_terminal_id',
      'make',
      'remark',
      'latitude',
      'longitude',
      'ring_logical_area_name',
      'system_category',
      'system_maintenance_terminal_name',
      'updated_at',
      'created_at',
      'status',
      'is_hub',
      'system_capacity_id' // Omit the ID, we'll show the name
    ],
    overrides: {
      system_name: {
        title: 'Name',
        width: 200,
        render: (value, record) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{value as string}</span>
            <TruncateTooltip
              className="text-xs text-gray-500 dark:text-gray-400"
              text={'S/N: ' + record.s_no}
            />
          </div>
        ),
      },
      s_no: {
        title: 'S/N',
        width: 100,
        excelFormat: 'text',
      },
      system_type_code: {
        title: 'Type',
        dataIndex: 'system_type_code',
        width: 120,
      },
      // ADDED
      system_capacity_name: {
        title: 'Capacity',
        width: 100,
      },
      node_name: {
        title: 'Node / Location',
        width: 150,
        render: (value) => (
          <div className="flex items-center gap-1">
            <FiMapPin className="h-3 w-3 text-gray-400" />
            <span>{(value as string) || 'N/A'}</span>
          </div>
        ),
      },
      ip_address: {
        title: 'IP Address',
        width: 180,
        render: (value) => (
          <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
            {(value as string) || 'N/A'}
          </code>
        ),
      },
      // THE FIX: New column definition to render the aggregated ring associations.
      ring_associations: {
        key: 'ring_associations',
        title: 'Ring(s)',
        dataIndex: 'ring_associations',
        width: 200,
        // This line ensures the complex object is properly stringified for the Excel export.
        excelFormat: 'json',
        render: (value) => {
          const associations = value as RingAssociation[] | null;
          if (!associations || associations.length === 0) {
            return <span className="text-gray-400 italic">N/A</span>;
          }
          return (
            <div className="flex flex-col gap-1">
              {associations.map(assoc => (
                <div key={assoc.ring_id} className="text-xs">
                  <span className="font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {assoc.ring_name}
                  </span>
                  <span className="text-gray-500 ml-1">(Order: {assoc.order_in_ring})</span>
                </div>
              ))}
            </div>
          );
        }
      },
      status: {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 150,
        render: (value) => <StatusBadge status={value as boolean} />,
      },
      commissioned_on: {
        title: 'Commissioned On',
        width: 150,
        render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }),
      },
    },
  });
};