import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { formatDate } from '@/utils/formatters';

export const OfcTableColumns = (data: Row<'v_ofc_cables_complete'>[]) => {
  return useDynamicColumnConfig('v_ofc_cables_complete', {
    data: data,

    omit: [
      'created_at',
      'en_id',
      'id',
      'maintenance_area_code',
      'maintenance_terminal_id',
      'ofc_owner_id',
      'ofc_owner_name',
      'ofc_type_id',
      'ofc_type_name',
      'sn_id',
      'updated_at',
      'status'
    ],
    overrides: {
      asset_no: {
        title: 'Asset No',
        sortable: true,
        searchable: true,
        render: (value: unknown) => {
          return (
            <TruncateTooltip
              text={(value as string) ?? ''}
              className="font-semibold"
            />
          );
        },
      },
      route_name: {
        title: 'Route',
        sortable: true,
        searchable: true,
        render: (_value: unknown, record: Row<'v_ofc_cables_complete'>) => {
          const rel = record.route_name;
          return (
            <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />
          );
        },
      },
      maintenance_area_name: {
        title: 'Maintenance Area',
        sortable: true,
        searchable: true,
        render: (_value: unknown, record: Row<'v_ofc_cables_complete'>) => {
          const rel = record.maintenance_area_name;
          return (
            <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />
          );
        },
      },
      commissioned_on: {
        title: 'Commissioned On',
        sortable: true,
        searchable: true,
        render: (value: unknown) => {
          return formatDate(value as string, { format: 'dd-mm-yyyy' });
        },
      },
      status: {
        title: 'Status',
        sortable: true,
        searchable: true,
        render: (value: unknown) => {
          return <StatusBadge status={value as string} />;
        },
      },
    },
  });
};
