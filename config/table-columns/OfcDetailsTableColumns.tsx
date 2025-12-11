// config/table-columns/OfcDetailsTableColumns.tsx
import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';

export const OfcDetailsTableColumns = (
  data: Row<'v_ofc_connections_complete'>[]
) => {
  return useDynamicColumnConfig('v_ofc_connections_complete', {
    data: data,
    omit: [
      'id', 'ofc_id', 'created_at', 'updated_at', 'sn_id', 'en_id', 'connection_category',
      'destination_port', 'en_name', 'path_segment_order', 'sn_name', 'source_port',
      'system_id', 
      // REMOVED 'system_name' from here so it shows up
      'ofc_type_name', 'ofc_route_name', 'fiber_no_sn',
      'fiber_no_en', 'logical_path_id', 'remark', 'status', 'maintenance_area_name', "updated_sn_id","updated_en_id", "connection_type","fiber_role","path_direction"
    ],
    overrides: {
      system_name: {
        title: 'Connected Service',
        sortable: true,
        searchable: true,
        width: 300, // Give it plenty of space
        render: (value) => (
          <div className="flex flex-col justify-center">
             {value ? (
                <TruncateTooltip 
                  text={value as string} 
                  className="font-medium text-gray-900 dark:text-gray-100 text-sm" 
                />
             ) : (
                <span className="text-gray-400 text-xs italic">Unassigned</span>
             )}
          </div>
        ),
      },
      updated_sn_name: {
        title: 'End A Node',
        sortable: true,
        searchable: true,
      },
      updated_en_name: {
        title: 'End B Node',
        sortable: true,
        searchable: true,
      },
      updated_fiber_no_sn: {
        title: 'End A Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
      },
      updated_fiber_no_en: {
        title: 'End B Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
      },
      otdr_distance_sn_km: {
        title: 'End A OTDR (km)',
        sortable: true,
        searchable: true,
      },
      otdr_distance_en_km: {
        title: 'End B OTDR (km)',
        sortable: true,
        searchable: true,
      },
      updated_sn_id: {
        title: 'End A Node',
        excelFormat: 'text',
        render(value, record) {
          return <TruncateTooltip text={record.updated_sn_name || (value as string) || '—'} />;
        },
      },
      updated_en_id: {
        title: 'End B Node',
        excelFormat: 'text',
        render(value, record) {
          return <TruncateTooltip text={record.updated_en_name || (value as string) || '—'} />;
        },
      },
      en_dom: { 
        title: 'End B D.O.M.', 
        sortable: true, 
        width: 120, 
        searchable: true, 
        render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }) 
      },
      sn_dom: { 
        title: 'End A D.O.M.', 
        sortable: true, 
        width: 120, 
        searchable: true, 
        render: (value) => formatDate(value as string, { format: 'dd-mm-yyyy' }) 
      },
      // Simplify headers to save space
      sn_power_dbm: { title: 'End A (dBm)', sortable: true },
      en_power_dbm: { title: 'End B (dBm)', sortable: true },
      route_loss_db: { title: 'Loss (dB)', sortable: true },
      connection_type: { title: 'Type', sortable: true },
    },
  });
};