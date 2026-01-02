// config/table-columns/OfcDetailsTableColumns.tsx
import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import React from 'react';

export const OfcDetailsTableColumns = (data: Row<'v_ofc_connections_complete'>[]) => {
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
      'destination_port',
      'en_name',
      'path_segment_order',
      'sn_name',
      'source_port',
      'system_id',
      'ofc_type_name',
      'ofc_route_name',
      'fiber_no_sn',
      'fiber_no_en',
      'logical_path_id',
      'status', // Status is shown via row styling or separate badge usually, but we omit raw column
      'maintenance_area_name',
      'updated_sn_id',
      'updated_en_id',
      'path_direction',
    ],
    overrides: {
      system_name: {
        title: 'Connected Service',
        excelHeader: 'System Name',
        sortable: true,
        searchable: true,
        width: 250,
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
        sortable: true,
        width: 100,
      },
      fiber_role: {
        title: 'Role',
        excelHeader: 'Fiber Role',
        sortable: true,
        width: 100,
      },
      updated_sn_name: {
        title: 'End A Node',
        sortable: true,
        searchable: true,
        alwaysVisible: true,
        width: 180,
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
        alwaysVisible: true,
        width: 180,
        render: (value, record) => (
          <TruncateTooltip
            text={(value as string) || record.en_name || '—'}
            className="font-medium text-gray-900 dark:text-gray-100"
          />
        ),
      },
      updated_fiber_no_sn: {
        title: 'F-A',
        width: 40,
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
          <span className="font-mono font-bold">{(value as number) || record.fiber_no_sn}</span>
        ),
      },
      updated_fiber_no_en: {
        title: 'F-B',
        width: 40,
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
          <span className="font-mono font-bold">{(value as number) || record.fiber_no_en}</span>
        ),
      },
      otdr_distance_sn_km: {
        title: 'RKM (End A)',
        editable: true,
        sortable: true,
        width: 110,
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            {value ? `${value}` : '-'}
          </span>
        ),
      },
      otdr_distance_en_km: {
        title: 'RKM (End B)',
        editable: true,
        sortable: true,
        width: 110,
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
            {value ? `${value}` : '-'}
          </span>
        ),
      },
      route_loss_db: {
        title: 'Loss (dB)',
        editable: true,
        sortable: true,
        width: 100,
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            {value ? `${value}` : '-'}
          </span>
        ),
      },
      sn_power_dbm: {
        title: 'Pwr A (dBm)',
        editable: true,
        sortable: true,
        width: 110,
      },
      en_power_dbm: {
        title: 'Pwr B (dBm)',
        editable: true,
        sortable: true,
        width: 110,
      },
      sn_dom: {
        title: 'DOM A',
        sortable: true,
        width: 100,
        render: (value) =>
          value ? (
            <span className="text-xs text-gray-600 dark:text-amber-50">
              {formatDate(value as string, { format: 'dd-mm-yyyy' })}
            </span>
          ) : (
            '-'
          ),
      },
      en_dom: {
        title: 'DOM B',
        sortable: true,
        width: 100,
        render: (value) =>
          value ? (
            <span className="text-xs text-gray-600 dark:text-amber-50">
              {formatDate(value as string, { format: 'dd-mm-yyyy' })}
            </span>
          ) : (
            '-'
          ),
      },
      remark: {
        editable: true,
        title: 'Remarks',
        width: 200,
        render: (value) => (
          <TruncateTooltip
            text={value as string}
            className="text-xs text-gray-800 dark:text-amber-50 italic"
          />
        ),
      },
    },
  });
};
