'use client';

// app/dashboard/ofc/[id]/page.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useOfcConnection } from '@/hooks/useOfcConnection';
import {
  ButtonSpinner,
  PageSpinner,
} from '@/components/common/ui/LoadingSpinner';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import { DataTable } from '@/components/table';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import { useDebouncedCallback } from 'use-debounce';
import { Button } from '@/components/common/ui';
import { OfcStats } from '@/components/ofc/OfcStats';
import { DEFAULTS } from '@/config/constants';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';

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
      ({ active_count, inactive_count, total_count, ...rest }) => rest
    );
  }, [existingConnections]);

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
  const [filters, setFilters] = useState<OfcConnectionFilters>({
    search: '',
    ofc_owner_id: '',
  });

  const tableExcelDownload = useTableExcelDownload(supabase, 'ofc_connections');
  const columnsForExcelExport = useDynamicColumnConfig('ofc_connections');

  const handleExport = () => {
    // Ensure we have a valid cable id before attempting export to satisfy Filters type
    if (!cable?.id) {
      return;
    }
    const tableName = 'ofc_connections';
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-${String(
        tableName + '-' + cable?.route_name
      )}-export.xlsx`,
      sheetName: String(tableName),
      columns: columnsForExcelExport as Column<Row<typeof tableName>>[],
      filters: {
        ofc_id: cable.id, // string (defined) — avoids undefined which Filters does not allow
      },
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, DEFAULTS.DEBOUNCE_DELAY);

  // Define handleSearch before using it in customToolbar
  const handleSearch = useCallback(
    (value: string) => {
      // Update the input value immediately for better UX
      setFilters((prev) => ({ ...prev, search: value }));
      // Debounce the actual search operation (safe even if immediate set happens)
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const loading = isLoading;

  const handleBackToOfcList = () => {
    setIsBackClicked(true);
    router.back();
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!cable) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                OFC cable with ID {id} not found.
              </p>
              <button
                onClick={handleBackToOfcList}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {isBackClicked ? <ButtonSpinner /> : '&larr; Back to OFC List'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = cable.status ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Inactive
    </span>
  );

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Asset No.</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {String(cable.asset_no ?? '-')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Route Name</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {String(cable.route_name ?? '-')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span>{statusBadge}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">Metadata</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">OFC Type</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable?.ofc_type?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Maintenance Area</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable?.maintenance_area?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Commissioned On</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cable.commissioned_on
                  ? new Date(String(cable.commissioned_on)).toLocaleDateString()
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

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
          onSearchChange={(value) => {
            // reset to first page and update debounced server-side search
            setPagination((p) => ({ ...p, page: 1 }));
            handleSearch(value);
          }}
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
