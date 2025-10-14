// path: components/ofc-details/OfcDetailsTableColumns.tsx
import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { formatDate } from '@/utils/formatters';

export const OfcDetailsTableColumns = (
  data: Row<'v_ofc_connections_complete'>[]
) => {
  return useDynamicColumnConfig('v_ofc_connections_complete', {
    data: data,
    // THE FIX: Removed the problematic columns from the omit list so their overrides can be applied.
    omit: [
      'id', 'ofc_id', 'created_at', 'updated_at', 'sn_id', 'en_id', 'connection_category',
      'destination_port', 'en_name', 'path_segment_order', 'sn_name', 'source_port',
      'system_id', 'system_name', 'ofc_type_name', 'ofc_route_name', 'fiber_no_sn',
      'fiber_no_en', 'logical_path_id', 'remark', 'status', 'maintenance_area_name'
    ],
    overrides: {
      updated_fiber_no_sn: {
        title: 'End A Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer', // Explicitly format as integer
      },
      updated_fiber_no_en: {
        title: 'End B Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer', // Explicitly format as integer
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
      updated_sn_id: {
        title: 'End A ID',
        excelFormat: 'text', // Explicitly format as text to prevent conversion to number
        render(value, record) {
          return record.updated_sn_name || (value as string);
        },
      },
      updated_en_id: {
        title: 'End B ID',
        excelFormat: 'text', // Explicitly format as text
        render(value, record) {
          return record.updated_en_name || (value as string);
        },
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
    },
  });
};