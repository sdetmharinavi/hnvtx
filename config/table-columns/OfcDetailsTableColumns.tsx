// config/table-columns/OfcDetailsTableColumns.tsx
import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import React from 'react';

export const OfcDetailsTableColumns = (
  data: Row<'v_ofc_connections_complete'>[]
) => {
  return useDynamicColumnConfig('v_ofc_connections_complete', {
    data: data,
    omit: [
      'id', 'ofc_id', 'created_at', 'updated_at', 'sn_id', 'en_id', 'connection_category',
      'destination_port', 'en_name', 'path_segment_order', 'sn_name', 'source_port',
      'system_id', 
      'ofc_type_name', 'ofc_route_name', 'fiber_no_sn',
      'fiber_no_en', 'logical_path_id', 'status', 'maintenance_area_name', "updated_sn_id","updated_en_id", 
      "path_direction"
    ],
    overrides: {
      system_name: {
        title: 'Connected Service',
        excelHeader: 'System Name',
        sortable: true,
        searchable: true,
        width: 300, 
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
      connection_type: { 
        title: 'Type', 
        excelHeader: 'Connection Type',
        sortable: true 
      },
      fiber_role: { 
        title: 'Role', 
        excelHeader: 'Fiber Role',
        sortable: true 
      },
      updated_sn_name: {
        title: 'End A Node',
        sortable: true,
        searchable: true,
        // THE FIX: Set alwaysVisible to true so it shows up even if all DB values are null
        alwaysVisible: true,
        render: (value, record) => (
          <TruncateTooltip 
            text={(value as string) || record.sn_name || '—'} 
            className="font-medium text-gray-900 dark:text-gray-100" 
          />
        ),
      },
      updated_en_name: {
        title: 'End B Node',
        sortable: true,
        searchable: true,
        // THE FIX: Set alwaysVisible to true
        alwaysVisible: true,
        render: (value, record) => (
          <TruncateTooltip 
            text={(value as string) || record.en_name || '—'} 
            className="font-medium text-gray-900 dark:text-gray-100" 
          />
        ),
      },
      updated_fiber_no_sn: {
        title: 'End A Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
            <span>{value as number || record.fiber_no_sn}</span>
        )
      },
      updated_fiber_no_en: {
        title: 'End B Fiber',
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
            <span>{value as number || record.fiber_no_en}</span>
        )
      },
      otdr_distance_sn_km: {
        title: 'End A OTDR (km)',
        editable: true,
        sortable: true,
        searchable: true,
      },
      otdr_distance_en_km: {
        title: 'End B OTDR (km)',
        editable: true,
        sortable: true,
        searchable: true,
      },
      updated_sn_id: {
        title: 'End A Node ID',
        excelFormat: 'text',
        render(value, record) {
          return <TruncateTooltip text={record.updated_sn_name || record.sn_name || (value as string) || '—'} />;
        },
      },
      updated_en_id: {
        title: 'End B Node ID',
        excelFormat: 'text',
        render(value, record) {
          return <TruncateTooltip text={record.updated_en_name || record.en_name || (value as string) || '—'} />;
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
      sn_power_dbm: { title: 'End A (dBm)', sortable: true },
      en_power_dbm: { title: 'End B (dBm)', sortable: true },
      route_loss_db: { title: 'Loss (dB)', sortable: true },
      remark: {
        editable: true,
      }
    },
  });
};