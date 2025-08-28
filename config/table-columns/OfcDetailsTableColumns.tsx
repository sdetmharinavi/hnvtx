import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { formatDate } from '@/utils/formatters';

export const OfcDetailsTableColumns = (
  data: Row<'v_ofc_connections_complete'>[]
) => {
  return useDynamicColumnConfig('v_ofc_connections_complete', {
    data: data,

    omit: [
      'id',
      'ofc_id',
      'created_at',
      'updated_at',
      'sn_id',
      'en_id',
      'connection_category',
      'connection_type',
      'destination_port',
      'en_name',
      'logical_path_id',
      'path_segment_order',
      'sn_name',
      'source_port',
      'system_id',
      'system_name',
    ],
    overrides: {
      fiber_no_sn: { 
        title: 'End A Fiber', 
        sortable: true, 
        searchable: true,
        excelFormat: 'number',
        render: (value) => {
          if (value === null || value === undefined) return '';
          return String(value);
        }
      },
      fiber_no_en: { 
        title: 'End B Fiber', 
        sortable: true, 
        searchable: true,
        excelFormat: 'number',
        render: (value) => {
          if (value === null || value === undefined) return '';
          return String(value);
        }
      },
      otdr_distance_sn_km: {
        title: 'End A OTDR Distance (km)',
        sortable: true,
        searchable: true,
      },
      otdr_distance_en_km: {
        title: 'End B OTDR Distance (km)',
        sortable: true,
        searchable: true,
      },
      en_dom: { title: 'End B D.O.M.', sortable: true, width: '150px', searchable: true, render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }) },
      en_power_dbm: {
        title: 'End B Power (dBm)',
        sortable: true,
        searchable: true,
      },
      sn_dom: { title: 'End A D.O.M.', sortable: true, width: '150px', searchable: true, render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }) },
      sn_power_dbm: {
        title: 'End A Power (dBm)',
        sortable: true,
        searchable: true,
      },
      route_loss_db: {
        title: 'Route Loss (dB)',
        sortable: true,
        searchable: true,
      },
      connection_type: {
        title: 'Connection Type',
        sortable: true,
        searchable: true,
      },
      ofc_type_name: { title: 'Ofc Type', sortable: true, searchable: true },
      destination_port: {
        title: 'Destination Port',
        sortable: true,
        searchable: true,
      },
      logical_path_id: {
        title: 'Logical Path ID',
        sortable: true,
        searchable: true,
      },
      ofc_id: { title: 'OFC ID', sortable: true, searchable: true },
      path_segment_order: {
        title: 'Path Segment Order',
        sortable: true,
        searchable: true,
      },
      remark: { title: 'Remark', sortable: true, searchable: true },
      source_port: { title: 'Source Port', sortable: true, searchable: true },
      system_id: { title: 'System ID', sortable: true, searchable: true },
      updated_at: { title: 'Updated At', sortable: true, searchable: true },
      status: {
        title: 'Status',
        sortable: true,
        searchable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {value ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    },
  });
};
