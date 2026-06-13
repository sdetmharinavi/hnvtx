import { Row } from '@/hooks/database';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { StatusBadge } from '@/components/common/ui';
import { formatDate } from '@/utils/formatters';
import { Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { LinkedCable } from '@/schemas/custom-schemas';

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
      'status',
    ],
    overrides: {
      asset_no: {
        title: 'Asset No',
        sortable: true,
        searchable: true,
        render: (value: unknown) => {
          return <TruncateTooltip text={(value as string) ?? ''} className="font-semibold" />;
        },
      },
      route_name: {
        title: 'Route',
        sortable: true,
        searchable: true,
        render: (_value: unknown, record: Row<'v_ofc_cables_complete'>) => {
          const rel = record.route_name;
          return <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />;
        },
      },
      maintenance_area_name: {
        title: 'Maintenance Area',
        sortable: true,
        searchable: true,
        render: (_value: unknown, record: Row<'v_ofc_cables_complete'>) => {
          const rel = record.maintenance_area_name;
          return <TruncateTooltip text={rel ?? 'N/A'} className="font-semibold" />;
        },
      },
      linked_cables: {
        title: 'Linked Cables',
        width: 200,
        render: (value: unknown) => {
          // Safely parse the value whether it arrives as an array or a JSON string
          let links: LinkedCable[] = [];
          if (typeof value === 'string') {
            try {
              links = JSON.parse(value);
            } catch {
              links = [];
            }
          } else if (Array.isArray(value)) {
            links = value as LinkedCable[];
          }

          if (!links || links.length === 0) {
            return <span className="text-gray-400 dark:text-gray-500 italic text-xs">None</span>;
          }

          return (
            <div className="flex flex-col gap-1.5">
              {links.map((link, idx) => (
                <Link
                  key={link.link_id || idx}
                  href={`/dashboard/ofc/${link.cable_id}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()} // Prevent row click
                  className="group flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  title={link.description || link.route_name}
                >
                  <LinkIcon className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="truncate max-w-[160px] group-hover:underline">
                    {link.route_name}
                  </span>
                </Link>
              ))}
            </div>
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
