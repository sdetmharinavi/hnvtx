// path: config/table-columns/OfcDetailsTableColumns.tsx
import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import React from 'react';
import { Cable } from 'lucide-react';

// Helper component for metric badges
const MetricBadge = ({
  value,
  suffix,
  colorClass = 'amber',
}: {
  value: string | number | null | undefined;
  suffix: string;
  colorClass?: 'amber' | 'blue' | 'purple';
}) => {
  const colorMap = {
    amber:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${colorMap[colorClass]}`}>
      {value ? `${value} ${suffix}` : '-'}
    </span>
  );
};

export const OfcDetailsTableColumns = (
  data: Row<'v_ofc_connections_complete'>[],
  showCableContext: boolean = false,
) => {
  const omitFields = [
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
    'fiber_no_sn',
    'fiber_no_en',
    'logical_path_id',
    'status', // Status is shown via row styling or separate badge usually, but we omit raw column
    'maintenance_area_name',
    'updated_sn_id',
    'updated_en_id',
    'path_direction',
  ];

  if (!showCableContext) {
    omitFields.push('ofc_route_name');
  }

  return useDynamicColumnConfig('v_ofc_connections_complete', {
    data: data,
    omit: omitFields as any,
    overrides: {
      ofc_route_name: {
        title: 'Cable Route',
        width: 240,
        sortable: true,
        searchable: true,
        render: (value, record) => (
          <a
            href={`/dashboard/ofc/${record.ofc_id}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='flex items-center gap-2 text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-semibold group transition-colors'
            title='Open Parent Cable in new tab'>
            <div className='p-1 bg-blue-100 dark:bg-blue-900/40 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors'>
              <Cable className='w-4 h-4 shrink-0' />
            </div>
            <TruncateTooltip text={value as string} className='truncate group-hover:underline' />
          </a>
        ),
      },
      system_name: {
        title: 'Connected Service',
        excelHeader: 'System Name',
        sortable: true,
        searchable: true,
        width: 200,
        render: (value) => (
          <div className='w-full overflow-hidden'>
            {value ? (
              <TruncateTooltip
                text={value as string}
                className='text-xs font-medium text-gray-800 dark:text-amber-50'
              />
            ) : (
              <span className='text-gray-400 text-xs italic'>Unassigned</span>
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
            className='font-medium text-gray-900 dark:text-gray-100'
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
            className='font-medium text-gray-900 dark:text-gray-100'
          />
        ),
      },
      updated_fiber_no_sn: {
        title: 'F-A',
        width: 50,
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
          <span className='font-mono font-bold'>{(value as number) || record.fiber_no_sn}</span>
        ),
      },
      updated_fiber_no_en: {
        title: 'F-B',
        width: 50,
        sortable: true,
        searchable: true,
        excelFormat: 'integer',
        alwaysVisible: true,
        render: (value, record) => (
          <span className='font-mono font-bold'>{(value as number) || record.fiber_no_en}</span>
        ),
      },
      otdr_distance_sn_km: {
        title: 'RKM (End A)',
        editable: true,
        sortable: true,
        width: 110,
        render: (value) => (
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'>
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
          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'>
            {value ? `${value}` : '-'}
          </span>
        ),
      },
      route_loss_db: {
        title: 'Loss (dB)',
        editable: true,
        sortable: true,
        width: 100,
        render: (value) => <MetricBadge value={value as string} suffix='dB' colorClass='amber' />,
      },
      sn_power_dbm: {
        title: 'Pwr A (dBm)',
        editable: true,
        sortable: true,
        width: 110,
        render: (value) => <MetricBadge value={value as string} suffix='dBm' colorClass='purple' />,
      },
      en_power_dbm: {
        title: 'Pwr B (dBm)',
        editable: true,
        sortable: true,
        width: 110,
        render: (value) => <MetricBadge value={value as string} suffix='dBm' colorClass='blue' />,
      },
      sn_dom: {
        title: 'DOM A',
        sortable: true,
        width: 100,
        render: (value) =>
          value ? (
            <span className='text-xs text-gray-600 dark:text-amber-50'>
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
            <span className='text-xs text-gray-600 dark:text-amber-50'>
              {formatDate(value as string, { format: 'dd-mm-yyyy' })}
            </span>
          ) : (
            '-'
          ),
      },
      remark: {
        editable: true,
        title: 'Remarks',
        sortable: true,
        width: 200,
        render: (value) => (
          <TruncateTooltip
            text={value as string}
            className='text-xs text-gray-800 dark:text-amber-50 italic'
          />
        ),
      },
    },
  });
};
