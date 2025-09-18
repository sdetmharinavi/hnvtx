'use client';

// app/dashboard/ofc/[id]/page.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useCreateOfcConnection } from '@/hooks/useCreateOfcConnection';
import { PageSpinner } from '@/components/common/ui/LoadingSpinner';
import { DataTable } from '@/components/table';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row, usePagedOfcConnectionsComplete } from '@/hooks/database';
import { Button, ConfirmModal } from '@/components/common/ui';
import { OfcStats } from '@/components/ofc/OfcStats';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';
import { TABLE_COLUMN_KEYS } from '@/config/table-column-keys';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { OfcConnectionRowsWithCount } from '@/types/view-row-types';
import { createStandardActions } from '@/components/table/action-helpers';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import {
  OfcConnectionsFormModal,
  OfcConnectionsRow,
} from '@/components/ofc-details/OfcConnectionsFormModal';

export const dynamic = 'force-dynamic';

export type OfcConnectionFilters = {
  search: string;
  ofc_owner_id: string;
};

// 1. ADAPTER HOOK: Makes `useOfcData` compatible with `useCrudManager`
const useOfcConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<OfcConnectionRowsWithCount> => {
  const { currentPage, pageLimit, searchQuery } = params;
  const supabase = createClient();
  const { id } = useParams();
  const cableId = id as string;

  const { data, isLoading, error, refetch } = usePagedOfcConnectionsComplete(
    supabase,
    {
      filters: { ofc_id: cableId, ...(searchQuery ? { searchQuery } : {}) },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  console.log('Data structure:', data ? Object.keys(data[0] || {}) : 'No data');

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  };
};

export default function OfcCableDetailsPage() {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: cableConnectionsData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    // isMutating,
    // error,
    refetch,
    pagination,
    // search,
    // filters: crudFilters,
    editModal,
    // viewModal,
    // bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_connections', OfcConnectionRowsWithCount>({
    tableName: 'ofc_connections',
    dataQueryHook: useOfcConnectionsData,
  });

  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const supabase = createClient();
  const [isBackClicked, setIsBackClicked] = useState(false);
  const { ensureConnectionsExist, cable } = useCreateOfcConnection({
    supabase,
    cableId: id as string,
    rawConnections: (cableConnectionsData || []).map((conn) => ({
      ...conn,
      id: conn.id ?? '',
      ofc_id:
        typeof conn.ofc_id === 'string'
          ? conn.ofc_id
          : typeof conn.ofc_id === 'object'
          ? JSON.stringify(conn.ofc_id) // or handle object differently
          : '',
      connection_category: conn.connection_category ?? '',
      connection_type: conn.connection_type ?? '',
      fiber_no_en: conn.fiber_no_en ?? 0,
      fiber_no_sn: conn.fiber_no_sn ?? 0,
      en_power_dbm: conn.en_power_dbm ?? null,
      sn_power_dbm: conn.sn_power_dbm ?? null,
      created_at: conn.created_at ?? null,
      updated_at: conn.updated_at ?? null,
      destination_port: conn.destination_port ?? null,
      en_dom: conn.en_dom ?? null,
      sn_dom: conn.sn_dom ?? null,
    })),
    refetchOfcConnections: refetch,
    isLoadingOfcConnections: isLoading,
  });

  // Automatically ensure connections exist when component mounts
  useEffect(() => {
    if (!isLoading) {
      ensureConnectionsExist();
    }
  }, [isLoading, ensureConnectionsExist]);

  // DataTable Configuration
  const columns = OfcDetailsTableColumns(cableConnectionsData);
  const orderedColumns = useOrderedColumns(
    columns,
    TABLE_COLUMN_KEYS.v_ofc_connections_complete
  );

  // Download Configuration
  // Convert filters to server format

  const tableExcelDownload = useTableExcelDownload(supabase, 'ofc_connections');

  // Generate export columns without using useMemo to avoid conditional hook calls
  const exportColumns = useDynamicColumnConfig('ofc_connections', { data: [] });

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
      orderBy: [{ column: 'fiber_no_sn', ascending: true }],
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

  const { data: isSuperAdmin } = useIsSuperAdmin();
  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: editModal.openEdit,
        onView: (record) => {},
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    [crudActions, editModal.openEdit, router, isSuperAdmin]
  );

  if (loading) {
    return <PageSpinner />;
  }

  if (!cable) {
    return (
      <CableNotFound
        id={id as string}
        handleBackToOfcList={handleBackToOfcList}
        isBackClicked={isBackClicked}
      />
    );
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
            cable?.asset_no ? '' : 'No Asset no. available'
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
      <OfcDetailsHeader
        cable={cable as unknown as Row<'v_ofc_cables_complete'>}
      />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DataTable<'v_ofc_connections_complete'>
          tableName="v_ofc_connections_complete"
          data={cableConnectionsData}
          columns={
            orderedColumns as Column<Row<'v_ofc_connections_complete'>>[]
          }
          loading={isLoading}
          actions={tableActions}
          selectable={true}
          searchable={true}
          filterable={false}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (page, limit) => {
              pagination.setCurrentPage(page);
              pagination.setPageLimit(limit);
            },
          }}
        />
      </div>
      <OfcConnectionsFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingOfcConnections={editModal.record as OfcConnectionsRow}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
        confirmText="Delete"
        cancelText="Cancel"
        showIcon={true}
      />
    </div>
  );
}
