'use client';

// app/dashboard/ofc/[id]/page.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useOfcConnection } from '@/hooks/useOfcConnection';
import {PageSpinner,
} from '@/components/common/ui/LoadingSpinner';
import { DataTable } from '@/components/table';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import { Button } from '@/components/common/ui';
import { OfcStats } from '@/components/ofc/OfcStats';
import { DEFAULTS } from '@/config/constants';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';

export const dynamic = 'force-dynamic';

export type OfcConnectionFilters = {
  search: string;
  ofc_owner_id: string;
};

export default function OfcCableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const supabase = createClient();
  const [pagination, setPagination] = useState({
    page: 1,
    pageLimit: DEFAULTS.PAGE_SIZE,
  });
  const [isBackClicked, setIsBackClicked] = useState(false);

  const {
    cable,
    existingConnections,
    isLoading,
    ensureConnectionsExist,
    totalCount,
    activeCount,
    inactiveCount,
  } = useOfcConnection({
    supabase,
    cableId: id as string,
    limit: pagination.pageLimit,
    offset: (pagination.page - 1) * pagination.pageLimit,
    orderBy: 'fiber_no_sn',
    orderDir: 'asc',
  });

  // Automatically ensure connections exist when component mounts
  useEffect(() => {
    if (!isLoading) {
      ensureConnectionsExist();
    }
  }, [isLoading, ensureConnectionsExist]);

  // Prepare data for DataTable: strip aggregate fields returned by RPC
  const tableData = useMemo(() => {
    const rows = existingConnections ?? [];
    return rows.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ active_count, inactive_count, total_count, ...rest }) => rest
    );
  }, [existingConnections]);

  console.log('tableData', tableData);

  // DataTable Configuration
  const columns = OfcDetailsTableColumns(
    tableData as Row<'v_ofc_connections_complete'>[]
  );

  const desiredOrder = [
    'ofc_route_name',
    'ofc_type_name',
    'fiber_no_sn',
    'otdr_distance_sn_km',
    'sn_dom',
    'sn_power_dbm',
    'fiber_no_en',
    'otdr_distance_en_km',
    'en_dom',
    'en_power_dbm',
    'route_loss_db',
    'status',
    'remark',
    'maintenance_area_name',
  ];

  const orderedColumns = useOrderedColumns(columns, desiredOrder);

  // Download Configuration
  // Convert filters to server format

  const tableExcelDownload = useTableExcelDownload(supabase, 'ofc_connections');
  
  // Generate export columns without using useMemo to avoid conditional hook calls
  const exportColumns = useDynamicColumnConfig('ofc_connections', {data: []});
  
  const handleExport = useCallback(() => {
    if (!cable?.id) return;
    
    const tableName = 'ofc_connections';
    
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-${String(
        tableName + '-' + (cable?.route_name || '')
      )}-export.xlsx`,
      sheetName: 'OFC Connections',
      columns: exportColumns as Column<Row<'ofc_connections'>>[],
      filters: {
        ofc_id: cable.id,
      },
      orderBy: 'fiber_no_sn',
      orderDir: 'asc' as const,
      maxRows: 10000,
      customStyles: {
        headerFont: { bold: true, color: { argb: 'FFFFFFFF' } },
        headerFill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FF1E40AF' },
        },
      },
    };
    
    tableExcelDownload.mutate(tableOptions);
  }, [cable?.id, cable?.route_name, tableExcelDownload, exportColumns]);

  const loading = isLoading;

  const handleBackToOfcList = () => {
    setIsBackClicked(true);
    router.back();
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!cable) {
    return <CableNotFound id={id as string} handleBackToOfcList={handleBackToOfcList} isBackClicked={isBackClicked} />
  }


  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            OFC Cable Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{`${
            cable?.transnet_id
              ? 'Transnet ID: ' + cable?.transnet_id
              : 'No Entry in Transnet'
          }`}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{`${
            cable?.asset_no
              ? ''
              : 'No Asset no. available'
          }`}</p>
        </div>
        <div>
          <Link
            href="/dashboard/ofc"
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Back to List
          </Link>
          <Button onClick={handleExport} variant="outline" className="ml-2">
            Export
          </Button>
        </div>
      </div>
      <OfcStats
        total={totalCount}
        active={activeCount}
        inactive={inactiveCount}
      />
      <OfcDetailsHeader cable={cable as unknown as Row<'v_ofc_cables_complete'>} />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DataTable<'v_ofc_connections_complete'>
          tableName="v_ofc_connections_complete"
          data={tableData as Row<'v_ofc_connections_complete'>[]}
          columns={
            orderedColumns as Column<Row<'v_ofc_connections_complete'>>[]
          }
          loading={isLoading}
          selectable={true}
          searchable={true}
          filterable={false}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: DEFAULTS.PAGE_SIZE_OPTIONS,
            onChange: (page, pageLimit) => setPagination({ page, pageLimit }),
          }}
        />
      </div>
    </div>
  );
}
